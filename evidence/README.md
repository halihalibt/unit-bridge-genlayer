# Stable Studionet evidence

[Contract `0x306025731f6BA798BFC5bD742614590d68ed6C6B`](https://explorer-studio.genlayer.com/address/0x306025731f6BA798BFC5bD742614590d68ed6C6B) · Chain ID 61999

## Source and SDK

[GenVM lint output](genvm-lint.json) records a successful static check and SDK validation with `genvm-linter 0.11.0`. It resolves the runner from the source header, `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`. The `I200` diagnostic announces a newer available runner.

[Source checksum](source.sha256) and [deployed-source verification](studionet/source.json) record SHA-256 `3f5035027ea35ba69585309e57abe670591db4ec8753312703589d2399c1d08c`. The deploy script compared the exact repository bytes with the code returned by `gen_getContractCode` after deployment reached finality.

## Finalized calls

Every receipt below reports a validator majority and `FINALIZED`. The execution result is the consensus leader's recorded result. For each expected rejection the receipt contains the exact rollback payload.

| Call | Transaction | Status | Execution |
| --- | --- | --- | --- |
| deploy | [0xa9aa5d44…](https://explorer-studio.genlayer.com/tx/0xa9aa5d448d6d517bce49af6796c8286aebe44f53a184fe0d237af50ea8a0e88b) · [receipt](studionet/deploy.json) | FINALIZED | SUCCESS |
| propose | [0x66bdc81f…](https://explorer-studio.genlayer.com/tx/0x66bdc81f753093d9358f5fe05c30022c8ef2bc8da074b0fe5185f2baf9d709ce) · [receipt](studionet/01-propose.json) | FINALIZED | SUCCESS |
| premature activation | [0x3716be64…](https://explorer-studio.genlayer.com/tx/0x3716be64bfb0b3ebd148d7f8d66194622a2b257d89331dcc5ea083be840a1243) · [receipt](studionet/02-premature-activation.json) | FINALIZED | ERROR · `revision not activatable` |
| qualify | [0x0da3580c…](https://explorer-studio.genlayer.com/tx/0x0da3580cbb132d7eaaefe36327181cdc055ef77ddb3b08d3787d153bfdb6b4bb) · [receipt](studionet/03-qualify.json) | FINALIZED | SUCCESS |
| activate | [0xc7c0317e…](https://explorer-studio.genlayer.com/tx/0xc7c0317ed91cf824e6ca2653890ac2de2e5eaad21ff9ee325726e37c0cec8de3) · [receipt](studionet/04-activate.json) | FINALIZED | SUCCESS |
| propose swapped | [0x46c6fc2f…](https://explorer-studio.genlayer.com/tx/0x46c6fc2f479febd14e0558be17a45326b7fe313ebdf4543fb4b4da7011051ecc) · [receipt](studionet/05-propose-swapped.json) | FINALIZED | SUCCESS |
| block swapped | [0xde189ea4…](https://explorer-studio.genlayer.com/tx/0xde189ea4930c52438fd57c979e0af56e326e192d4b4cc0f912580b4bc9bc9fc0) · [receipt](studionet/06-block-swapped.json) | FINALIZED | SUCCESS |
| repeat qualification | [0xb3f95d77…](https://explorer-studio.genlayer.com/tx/0xb3f95d774877dbd3a917821e00e9233f517d19cdba5ec716471fa5aef92241e5) · [receipt](studionet/07-repeat-qualification.json) | FINALIZED | ERROR · `revision not an eligible draft` |
| blocked activation | [0x29f071dd…](https://explorer-studio.genlayer.com/tx/0x29f071ddae0e07f2dfb252e5be2375ddda0f144e55d15db91dcabf00c951e033) · [receipt](studionet/08-blocked-activation.json) | FINALIZED | ERROR · `revision not activatable` |

## Finalized state

Revision 1 stayed `ACTIVE`. Revision 2 stayed `BLOCKED` after validators classified the swapped fields as `[DELTA, POINT]`. The active mapping returned `[1, 180000, 9, -2500, 1]` for the example inputs. [Readback values](studionet/readback.json).

## Deployment history

The [original deployment](initial-deployment/deploy.json) finalized successfully, but its [premature activation](initial-deployment/02-premature-activation.json) raised an SDK attribute error. The deployment above uses `gl.vm.UserError` and includes the matching rollback reason in the receipts.
