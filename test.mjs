import { parse } from 'pta-tools';
import { createReadStream, writeFileSync } from 'fs';
import {
  createClient,
  CreateAccountError,
  CreateTransferError,
  AccountFlags,
  TransferFlags,
} from 'tigerbeetle-node';
import { hasUncaughtExceptionCaptureCallback } from 'process';

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
  const parts = str.split(":");
  let result = "1";
  for (let i = 0; i < parts.length; i++) {
    let num = dictionary.indexOf(parts[i]);
    if (num == -1) {
      dictionary.push(parts[i]);
      num = dictionary.length - 1;
    }
    result += num.toString(10).padStart(3, '0');
  }
  console.log(`Encoded ${str} as ${result}`);
  return BigInt(result);
}

function accountUserDataToString(bigInt) {
  const str = bigInt.toString();
  const parts = [];
  for (let i = 1; i < str.length - 2; i += 3) {
    const num = parseInt(str.substring(i, i + 3));
    parts.push(dictionary[num.toString()]);
    // parts.push(`account /${i} is ${num}`);
  }
  return parts.join(':');
}

async function createAccounts(names, client) {
  let errors = await client.createAccounts(names.map((name, i) => {
    return {
      id: accountStringToUserData(name),
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
}

async function exportAccounts(client) {
  let foundSome = true;
  for(let first = 0; foundSome; first += 10) {
    const range = [...Array(10).keys()].map(i => BigInt(first + i));
    const accounts = await client.lookupAccounts(range);
    console.log(accounts.map(acc => {
      const accName = accountUserDataToString(acc.user_data);
      return `; account ${accName}\n`;
    }).join(''));
    foundSome = accounts.length > 0;
  }
  console.log("done");
}


async function exportTransfers(client) {
  let foundSome = true;
  for(let first = 0; foundSome; first += 10) {
    const range = [...Array(10).keys()].map(i => BigInt(first + i));
    console.log(range);
    const transfers = await client.lookupTransfers(range);
    for (let i = 0; i < transfers.length; i++) {
      console.log(transfers[i]);
      console.log(`looking up ${transfers[i].debit_account_id} and ${transfers[i].credit_account_id}`)
      const accounts = await client.lookupAccounts([ transfers[i].debit_account_id, transfers[i].credit_account_id ]);
      if (accounts.length != 2) {
        throw new Error("Accounts not found!");
      }
      const accName1 = accountUserDataToString(accounts[0].user_data);
      const accName2 = accountUserDataToString(accounts[1].user_data);
      console.log(`2022-01-01 exported\n  ${accName1} ${transfers[i].amount}\n  ${accName2}`);

    }
    foundSome = (transfers.length > 0);
  }
  console.log("done");
}

function makeTransfer(id, obj, i, equalizer) {
  console.log('makeTransfer', { id, obj, i, equalizer});
  console.log(obj.entries[i]);
  console.log(obj.entries[equalizer]);

  return {
    id: BigInt(id), // u128
    pending_id: 0n, // u128
    // Double-entry accounting:
    debit_account_id: accountStringToUserData(obj.entries[i].account),  // u128
    credit_account_id: accountStringToUserData(obj.entries[equalizer].account), // u128
    // Opaque third-party identifier to link this transfer to an external entity:
    user_data: 0n, // u128  
    reserved: 0n, // u128
    // Timeout applicable for a pending/2-phase transfer:
    timeout: 0n, // u64, in nano-seconds.
    // Collection of accounts usually grouped by the currency: 
    // You can't transfer money between accounts with different ledgers:
    ledger: 1,  // u32, ledger for transfer (e.g. currency).
    // Chart of accounts code describing the reason for the transfer:
    code: 720,  // u16, (e.g. deposit, settlement)
    flags: 0, // u16
    amount: BigInt(obj.entries[i].amount), // u64
    timestamp: 0n, //u64, Reserved: This will be set by the server.
  };
}

async function createTransfers(objects, client) {
  let transfers = [];
  let id = 1;
  objects.forEach((obj) => {
    console.log("parsing transfer", obj);
    if (typeof obj.entries == "undefined") {
      return;
    }
    let sum = 0;
    let equalizer;
    for (let i = 0; i < obj.entries.length; i++) {
      console.log("checking entry " + i);
      if (typeof obj.entries[i].amount === 'string') {
        console.log("adding " + obj.entries[i].amount, typeof obj.entries[i].amount);
        sum += parseFloat(obj.entries[i].amount);
        console.log("sum is now " + sum);
      } else if (equalizer === undefined) {
        console.log("equalizer is " + i);
        equalizer = i;
      } else {
        console.error(object);
        throw new Error('multiple entries without amount found');
      }
    }
    for (let i = 0; i < obj.entries.length; i++) {
      if (i !== equalizer) {
        transfers.push(makeTransfer(id, obj, i, equalizer));
        id++;
      }
    }
  });
  let errors = await client.createTransfers(transfers);
  console.log("transfers created", errors);
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
  // await exportAccounts(client);
  await exportTransfers(client);
  console.log("Back!");
  client.destroy();
}

// ...
run();
console.log("The End!");