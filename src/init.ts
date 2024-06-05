import { exit } from 'node:process';
import sqlite3 from 'sqlite3';

// check dir database if not exist create it
const fs = require('fs');
const dir = './database';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

new sqlite3.Database('./database/db.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.message.includes('SQLITE_CANTOPEN')) {
    createDatabase();
    return;
  } else if (err) {
    // console.log('Getting error ' + err);
    exit(1);
  }
});

function createDatabase() {
  var newdb = new sqlite3.Database('./database/db.db', (err) => {
    if (err) {
      console.log('Getting error ' + err);
      exit(1);
    }
    createTables(newdb);
  });

  return newdb;
}

function createTables(newdb) {
  try {
    newdb.exec(`
      BEGIN TRANSACTION;
      
      CREATE TABLE IF NOT EXISTS deposit (
        transactionHash TEXT PRIMARY KEY,
        "from" TEXT,
        "to" TEXT,
        "amount" TEXT,
        "isEth" BOOLEAN,
        "extraData" TEXT,
        "remoteToken" TEXT,
        "localToken" TEXT,
        blockNumber INTEGER,
        addressContract TEXT,
        version TEXT
      );

      CREATE TABLE IF NOT EXISTS withdrawal (
        l1Token TEXT,
        l2Token TEXT,
        "from" TEXT,
        "to" TEXT,
        amount TEXT,
        extraData TEXT,
        transactionHash TEXT PRIMARY KEY,
        blockNumber INTEGER,
        addressContract TEXT
      );

      CREATE INDEX IF NOT EXISTS deposit_from_index ON deposit ("from");
      CREATE INDEX IF NOT EXISTS deposit_to_index ON deposit ("to");

      CREATE INDEX IF NOT EXISTS withdrawal_from_index ON withdrawal ("from");
      CREATE INDEX IF NOT EXISTS withdrawal_to_index ON withdrawal ("to");


      COMMIT TRANSACTION;
    `);
    console.log('Tables and indexes created successfully.');
  } catch (error) {
    console.error('Failed to create tables or indexes:', error);
  }
}
