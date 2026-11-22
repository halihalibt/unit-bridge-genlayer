# Unit Bridge

[Stable Studionet contract](https://explorer-studio.genlayer.com/address/0x306025731f6BA798BFC5bD742614590d68ed6C6B) · [Deployment and test evidence](evidence/README.md)

A dataset can deliver a temperature reading and a temperature *change* using the same unit symbols. Treating a change in kelvins as an absolute reading applies a 273.15 degree offset that does not belong there. Unit Bridge gives a data publisher a versioned mapping for this two-field schema and gives consumers an exact, reproducible conversion.

## From a data dictionary to an active mapping

The steward proposes the descriptions and declared units for the reading followed by the change. The proposal binds to the currently active revision. Anyone may qualify an eligible draft. The consensus leader and validators independently interpret the descriptions as `POINT`, `DELTA`, or `UNKNOWN`. The full ordered pair must match across the equivalence check before it can affect state. Swapping the two meanings or returning an ambiguous classification blocks the proposal.

A qualified revision still requires explicit steward activation. Activation retires its predecessor and invalidates sibling proposals based on that predecessor. Consumers get the revision alongside exact rational Celsius values and can reject a revision they have not integrated yet. Temperature values and the conversion formula never enter the model. The contract selects coefficients from the supported units and quantity kinds, so a model cannot invent a factor or offset.

| Input | Absolute reading in milli-°C | Change in milli-°C |
| --- | --- | --- |
| milli-°C | `x` | `x` |
| milli-K | `x − 273150` | `x` |
| milli-°F | `(5x − 160000) / 9` | `5x / 9` |

The literal units are `C`, `K`, and `F`. A conventional contract can implement these formulas. GenLayer adds validator agreement about which formula family the human-written dictionary implies before users can activate it.

## Interface

- `propose(measured, change, measured_unit, change_unit)` creates a `DRAFT`. The steward is the deployer.
- `qualify(revision)` resolves an eligible draft to `QUALIFIED` or `BLOCKED` using validator agreement.
- `activate(revision)` replaces the active mapping with an eligible qualified revision. The old mapping remains readable as `RETIRED`.
- `get_revision(revision)` returns a JSON record or an empty string if absent.
- `convert(point_milli, delta_milli)` returns `[revision, point_num, point_den, delta_num, delta_den]` in milli-°C. It fails before initial activation. Rounding is the consumer's choice.

Qualification interprets the supplied text. It cannot attest to physical measurements, certify the declared unit, or prove that upstream implementation matches the dictionary. The steward controls activation. Validators may disagree on borderline text. Use concise, explicit descriptions and submit a later revision when the dictionary changes.

## Reproduce on Stable Studionet

The test qualifies a Fahrenheit reading and a Kelvin change. For input `[68000, -2500]` the final view returns `[1, 180000, 9, -2500, 1]`, or 20 °C and a −2.5 °C change. It then runs a swapped proposal and verifies that the original conversion remains active.

```sh
python -m pip install genvm-linter==0.11.0
genvm-lint check contracts/unit_bridge.py --json
sha256sum -c evidence/source.sha256
npm ci
export STUDIONET_KEY_FILE=/absolute/path/to/test-only-signer
export STUDIONET_RUN_DIR=/absolute/path/to/fresh-run
node scripts/deploy.mjs
node tests/studionet.mjs
```

Use Node.js 22+ and a file containing a single hex-encoded test account key. The scripts are pinned to Stable Studionet, chain ID 61999, and use zero-value writes.

Offline fixtures exercise deterministic state transitions with Python. Run `python -m unittest discover -s tests -v`. The fixture tests do not contact any network.
