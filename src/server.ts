// src/app.ts

import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { ENV } from './utils/ENV';
import cors from 'cors';

// Create express app
const app = express();
const PORT = 3000 || ENV.PORT;

// Open database
async function openDb() {
  return open({
    filename: './database/db.db',
    driver: sqlite3.Database,
  });
}

app.use(express.json());

// Define your CORS options
const corsOptions = {
  origin: '*', // Allow all origins
  methods: 'GET', // Allow only GET requests
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
};

// Use the CORS middleware with the options
app.use(cors(corsOptions));

// Endpoint to fetch data with cursor and optional filter
// prevent SQL injection
app.get('/deposit', async (req: Request, res: Response) => {
  try {
    const db = await openDb();
    const limit = parseInt(req.query.limit as string) || 10; // Validate and default to 10 if invalid
    const from = req.query.from || '';
    const to = req.query.to || '';

    let query = 'SELECT * FROM deposit';
    const params: (string | number)[] = [];

    if (from && to) {
      query += ' WHERE "from" = ? AND "to" = ?'; // Escaping column names
      params.push(from, to);
    } else if (from) {
      query += ' WHERE "from" = ?'; // Escaping column name
      params.push(from);
    } else if (to) {
      query += ' WHERE "to" = ?'; // Escaping column name
      params.push(to);
    }

    query += ' ORDER BY blockNumber DESC LIMIT ?';
    params.push(limit);

    const data = await db.all(query, params);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/withdrawal', async (req: Request, res: Response) => {
  try {
    const db = await openDb();
    const limit = parseInt(req.query.limit as string) || 10; // Validate and default to 10 if invalid
    const from = req.query.from || '';
    const to = req.query.to || '';

    let query = 'SELECT * FROM withdrawal';
    const params: (string | number)[] = [];

    if (from && to) {
      query += ' WHERE "from" = ? AND "to" = ?'; // Escaping column names
      params.push(from, to);
    } else if (from) {
      query += ' WHERE "from" = ?'; // Escaping column name
      params.push(from);
    } else if (to) {
      query += ' WHERE "to" = ?'; // Escaping column name
      params.push(to);
    }

    query += ' ORDER BY blockNumber DESC LIMIT ?';
    params.push(limit);

    const data = await db.all(query, params);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
