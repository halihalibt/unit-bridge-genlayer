import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const endpoint = 'https://studio.genlayer.com/api';
const keyFile = process.env.STUDIONET_KEY_FILE;
const account = keyFile ? createAccount((await readFile(keyFile, 'utf8')).trim()) : undefined;
export const client = createClient({ chain: studionet, endpoint, account });
export const runFolder = process.env.STUDIONET_RUN_DIR
  ? pathToFileURL(resolve(process.env.STUDIONET_RUN_DIR) + '/')
  : new URL('../.studionet-run/', import.meta.url);
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function checkNetwork() {
  assert.equal(Number(await client.request({ method: 'eth_chainId' })), 61999);
}

export async function writeEvidence(path, data) {
  await mkdir(new URL('.', path), { recursive: true });
  const temp = new URL(path.href + '.tmp');
  await writeFile(temp, JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n');
  await rename(temp, path);
}

export async function transact(folder, name, submit, expectedError) {
  const pending = new URL(name + '.hash', folder);
  let hash;
  try {
    hash = (await readFile(pending, 'utf8')).trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    assert.ok(account, 'Set STUDIONET_KEY_FILE to a test-only signer file');
    if (submit === null) throw new Error('Provide a saved hash to resume');
    hash = await submit();
    console.log(name, hash);
    await writeFile(pending, hash + '\n', { flag: 'wx' });
  }
  const receipt = await client.waitForTransactionReceipt({
    hash, status: 'FINALIZED', interval: 2500, retries: 300, fullTransaction: true,
  });
  await writeEvidence(new URL(name + '.json', folder), receipt);
  assert.equal(receipt.statusName, 'FINALIZED');
  const leader = receipt.consensus_data?.leader_receipt?.find((item) => item.mode === 'leader');
  const result = receipt.txExecutionResultName ?? leader?.execution_result;
  console.log(name, receipt.statusName, result);
  if (expectedError) {
    assert.match(String(result), /^(ERROR|FINISHED_WITH_ERROR)$/i);
    assert.match(leader?.result?.status ?? '', /^(user_error|contract_error|rollback)$/);
    assert.equal(leader?.result?.payload, expectedError,
      'Expected the declared contract rejection');
  } else {
    assert.match(String(result), /^success$/i);
  }
  return receipt;
}

export async function verifySource(folder, address, source) {
  const remote = await client.getContractCode(address);
  assert.deepEqual(Buffer.from(remote), source);
  await writeEvidence(new URL('source.json', folder), {
    chainId: 61999, address, sha256: sha256(source), bytes: source.length,
    method: 'gen_getContractCode', byteMatch: true,
  });
}
