import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const sleep = require('util').promisify(setTimeout);

// Define the SQLite database file
const dbFile = './database/db.db';

export const formatSeconds = (seconds: number) => {
  // format seconds to human readable format
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${mins}m ${secs}s`;
};

// Function to handle retries with exponential backoff
export const attemptOperation = async (operation, retries = 3, delay = 100) => {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${i + 1}:`, err.message);
      await sleep(delay * Math.pow(2, i)); // exponential backoff
    }
  }

  throw lastError; // throw the last encountered error after retries are exhausted
};

export const attemptOperationInfinitely = async (
  operation,
  retries = 3,
  delay = 100
) => {
  let lastError = null;
  let timeShutdown = 0;

  while (true) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        console.error(`Attempt ${i + 1}:`, err.message);
        await sleep(delay * Math.pow(2, i)); // exponential backoff
      }
    }

    timeShutdown += 1;
    const retryS = timeShutdown * 60000;
    console.log(
      `Retrying in ${formatSeconds(retryS)} after ${retries} attempts.`
    );
    await sleep(retryS);
  }
};

export const insertEventWithdraw = async (db, event) => {
  const {
    l1Token,
    l2Token,
    from,
    to,
    amount,
    extraData,
    transactionHash,
    blockNumber,
    address,
  } = event;
  try {
    const stmt = await db.prepare(
      'INSERT INTO withdrawal (l1Token, l2Token, "from", "to", amount, extraData, transactionHash, blockNumber, addressContract) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    await stmt.run(
      l1Token,
      l2Token,
      from,
      to,
      amount,
      extraData,
      transactionHash,
      blockNumber,
      address
    );
  } catch (err) {
    console.error('Failed to insert event:', err);
  }
};

export const insertEventDeposit = async (db, event) => {
  const {
    from,
    to,
    version,
    opaqueData,
    transactionHash,
    address,
    blockNumber,
  } = event;
  try {
    const stmt = await db.prepare(
      'INSERT INTO deposit (transactionHash, "from", "to", blockNumber, addressContract, version, opaqueData) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    await stmt.run(
      transactionHash,
      from,
      to,
      blockNumber,
      address,
      version,
      opaqueData
    );
  } catch (err) {
    console.error('Failed to insert event:', err);
  }
};

// Connect to the SQLite database
export const connectDb = async () => {
  return open({
    filename: dbFile,
    driver: sqlite3.Database,
  });
};
