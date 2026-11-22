import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkNetwork, client, runFolder, transact, writeEvidence } from '../scripts/network.mjs';

const folder = runFolder;
const { address } = JSON.parse(await readFile(new URL('source.json', folder)));
await checkNetwork();

const call = (name, functionName, args, error) => transact(folder, name, () =>
  client.writeContract({ address, functionName, args, value: 0n, leaderOnly: false }), error);
const view = (functionName, args) => client.readContract({
  address, functionName, args, transactionHashVariant: 'latest-final', jsonSafeReturn: true,
});
const revision = async (id) => JSON.parse(await view('get_revision', [id]));
const point = 'Instantaneous outdoor air temperature at the sensor.';
const delta = 'Change in temperature since the preceding observation.';

await call('01-propose', 'propose', [point, delta, 'F', 'K']);
assert.equal((await revision(1)).state, 'DRAFT');
await call('02-premature-activation', 'activate', [1], 'revision not activatable');
assert.equal((await revision(1)).state, 'DRAFT');
await call('03-qualify', 'qualify', [1]);
const qualified = await revision(1);
assert.equal(qualified.state, 'QUALIFIED');
assert.deepEqual(qualified.classification, ['POINT', 'DELTA']);
await call('04-activate', 'activate', [1]);
assert.equal((await revision(1)).state, 'ACTIVE');
const converted = (await view('convert', [68000, -2500])).map(Number);
assert.deepEqual(converted, [1, 180000, 9, -2500, 1]);

await call('05-propose-swapped', 'propose', [delta, point, 'F', 'K']);
await call('06-block-swapped', 'qualify', [2]);
const blocked = await revision(2);
assert.equal(blocked.state, 'BLOCKED');
assert.deepEqual(blocked.classification, ['DELTA', 'POINT']);
await call('07-repeat-qualification', 'qualify', [2], 'revision not an eligible draft');
await call('08-blocked-activation', 'activate', [2], 'revision not activatable');
const active = await revision(1);
assert.equal(active.state, 'ACTIVE');
assert.deepEqual(await revision(2), blocked);
assert.deepEqual((await view('convert', [68000, -2500])).map(Number), converted);
await writeEvidence(new URL('readback.json', folder), {
  address, variant: 'latest-final', qualified, active, blocked, converted,
});
