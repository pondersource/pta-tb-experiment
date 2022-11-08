import { parse } from 'pta-tools';
import { createReadStream, writeFileSync } from 'fs';
import {
  createClient,
  CreateAccountError,
  CreateTransferError,
  AccountFlags,
  TransferFlags,
} from 'tigerbeetle-node';

const dictionary = [
  'assets',
  'bank',
  'checking',
  'income',
  'salary',
  'gifts',
  'saving',
  'expenses',
  'food',
  'supplies',
  'cash',
  'liabilities',
  'debt'
]
writeFileSync("dictionary.json", JSON.stringify(dictionary));

function accountStringToUserData(str) {
  parts = str.split(":");
  result = "1";
  for (let i = 0; i < parts.length; i++) {
    let num = dictionary.indexOf(parts[i]);
    if (num == -1) {
      dictionary.push(parts[i]);
      num = dictionary.length - 1;
    }
    result += num.toString(10).padStart(3, '0');
  }
  console.log(`Encoded ${str} as ${result}`);
  return new BigInt(result);
}

async function createAccounts(names, client) {
  let errors = await client.createAccounts(names.map((name, i) => {
    return {
      id: new BigInt(i + 1),
      ledger: 1,
      code: 718,
      user_data: accountStringToUserData(name),
      reserved: Buffer.alloc(48, 0),
      flags: 0,
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      timestamp: 0n,
    }
  }));
  console.log("accounts created", errors);
  const accounts = await client.lookupAccounts();
  console.log(accounts);
}

async function createTransfer(objects, client) {
  // let errors = await client.createTransfers(names.map((name, i) => {
  //   return {
  //     id: new BigInt(i + 1),
  //     ledger: 1,
  //     code: 718,
  //     user_data: accountStringToUserData(name),
  //     reserved: Buffer.alloc(48, 0),
  //     flags: 0,
  //     debits_pending: 0n,
  //     debits_posted: 0n,
  //     credits_pending: 0n,
  //     credits_posted: 0n,
  //     timestamp: 0n,
  //   }
  // }));
  // console.log("transfers created", errors);
}

async function run() {
  const filePath = './sample.journal';
  const readableStream = createReadStream(filePath);
  const parseResult = await parse(readableStream);
  console.log(parseResult);
  const client = createClient({
    cluster_id: 0,
    replica_addresses: ['3000']
  });
  
  await createAccounts(parseResult. accounts, client);
  await createTransfers(parseResult.journal, client);
}

// ...
run();