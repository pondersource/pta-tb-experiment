import { parse } from 'pta-tools';
import { createReadStream, promises } from 'fs';
import {
  createClient,
  CreateAccountError,
  CreateTransferError,
  AccountFlags,
  TransferFlags,
} from 'tigerbeetle-node';
import { argv, exit } from 'process';

function accountStringToUserData(str, dictionary) {
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
  // console.log(`Encoded ${str} as ${result}`);
  return BigInt(result);
}

function accountUserDataToString(bigInt, dictionary) {
  const str = bigInt.toString();
  const parts = [];
  for (let i = 1; i < str.length - 2; i += 3) {
    const num = parseInt(str.substring(i, i + 3));
    parts.push(dictionary[num.toString()]);
    // parts.push(`account /${i} is ${num}`);
  }
  return parts.join(':');
}

async function importJournal(filePath) {
  const readableStream = createReadStream(filePath);
  return parse(readableStream);
}

async function importDictionary(filePath) {
  return JSON.parse((await promises.readFile(filePath)).toString()); 
}

async function createAccounts(names, dictionary, client) {
  let errors = await client.createAccounts(names.map((name, i) => {
    return {
      id: accountStringToUserData(name, dictionary),
      ledger: 1,
      code: 718,
      user_data: accountStringToUserData(name, dictionary),
      reserved: Buffer.alloc(48, 0),
      flags: 0,
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      timestamp: 0n,
    }
  }));
  console.log("accounts created", errors.map(obj => {
    return `${obj.index}: ${obj.code} - ${CreateAccountError[obj.code]}`;
  }));
  let readBack = await client.lookupAccounts(names.map((name) => accountStringToUserData(name, dictionary)));
  names.forEach((name) => {
    const accountId = accountStringToUserData(name, dictionary);
    let found = false;
    for (let i = 0; i < readBack.length; i++) {
      if (readBack[i].id == accountId) {
        // console.log(`Found ${name}`);
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(`No account with name ${name} and id ${accountId} was created!`);
    }
  })
}

function makeTransfer(data, dictionary) {
  console.log('makeTransfer', data);
  console.log('amount as BigInt', BigInt(data.amount), BigInt(parseInt(data.amount)));

  return {
    id: BigInt(data.id), // u128
    pending_id: 0n, // u128
    // Double-entry accounting:
    debit_account_id: accountStringToUserData(data.from, dictionary),  // u128
    credit_account_id: accountStringToUserData(data.to, dictionary), // u128
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
    amount: BigInt(data.amount), // u64
    timestamp: 0n, //u64, Reserved: This will be set by the server.
  };
}

async function createTransfers(journal, dictionary, client) {
  let transferData = [];
  let id = 1;
  journal.forEach((obj) => {
    if (Array.isArray(obj.entries)) {
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
          transferData.push({ id, from:  obj.entries[i].account, to: obj.entries[equalizer].account, amount: obj.entries[i].amount });
          id++;
        }
      }  
    }
  });
  let errors = await client.createTransfers(transferData.map((data) => makeTransfer(data, dictionary)));
  console.log("transfers created", errors, errors.map(obj => {
    return `${obj.index}: ${obj.code} - ${CreateTransferError[obj.code]}`;
  }));
  const range = [...Array(transferData.length).keys()].map(x => BigInt(x + 1));
  console.log("reading back", transferData, range);
  let readBack = await client.lookupTransfers(range);
  console.log(readBack);
  for (let i = 0; i < transferData.length; i++) {
    if (transferData[i].id == readBack[i].id) {
      console.log(`ID OK: ${transferData[i].id}`);
    } else {
      console.error(`ID NOT OK: ${transferData[i].id} != ` .readBack[i].id);
    }

    if (transferData[i].from == accountUserDataToString(readBack[i].debit_account_id, dictionary)) {
      console.log(`FROM OK: ${transferData[i].from}`);
    } else {
      console.error(`FROM NOT OK: ${transferData[i].from} != ` . accountUserDataToString(readBack[i].debit_account_id, dictionary));
    }
    if (transferData[i].to == accountUserDataToString(readBack[i].credit_account_id, dictionary)) {
      console.log(`TO OK: ${transferData[i].to}`);
    } else {
      console.error(`TO NOT OK: ${transferData[i].to} != ` . accountUserDataToString(readBack[i].credit_account_id, dictionary));
    }
    if (transferData[i].amount == readBack[i].amount.toString()) {
      console.log(`AMOUNT OK: ${transferData[i].amount}`);
    } else {
      console.error(`AMOUNT NOT OK: ${transferData[i].amount} != ` . readBack[i].amount.toString());
    }
  }
}
      
async function main() {
  if (argv.length < 4) {
    console.error("Usage: node index.mjs ./sample.journal ./dictionary.json");
    exit(1);
  }
  console.log("importing Plain Text Accounting journal");
  const imported = await importJournal(argv[2]);
  console.log("importing dictionary");
  const dictionary = await importDictionary(argv[3]);
  console.log("creating TigerBeetle client");
  const client = createClient({
    cluster_id: 0,
    replica_addresses: ['3000']
  });
  console.log("creating accounts");
  await createAccounts(imported.accounts, dictionary, client);
  console.log("creating transfers");
  await createTransfers(imported.journal, dictionary, client);
  console.log("destroying client");
  client.destroy();
  console.log("The End!");
}


// ...
main();