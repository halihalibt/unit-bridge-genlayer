import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { checkNetwork, client, runFolder, transact, verifySource } from './network.mjs';

const folder = runFolder;
const sourceFile = 'unit_bridge.py';
const source = await readFile(new URL('../contracts/' + sourceFile, import.meta.url));
const args = [];

await checkNetwork();
await mkdir(folder, { recursive: true });
const deployment = await transact(folder, 'deploy', () =>
  client.deployContract({ code: source, args, leaderOnly: false }));
const address = deployment.data?.contract_address ?? deployment.txDataDecoded?.contractAddress
  ?? deployment.to_address;
assert.match(address, /^0x[0-9a-f]{40}$/i);
assert.notEqual(address.toLowerCase(), '0x' + '0'.repeat(40));
await verifySource(folder, address, source);
console.log(address);
