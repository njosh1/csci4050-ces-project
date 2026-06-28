// lib/db.ts
// ─────────────────────────────────────────────────────────────
//  MySQL connection pool for the CES project.
//  Fill in your own credentials below, or set environment
//  variables in a .env.local file (recommended):
//
//    DB_HOST=localhost
//    DB_USER=root
//    DB_PASSWORD=yourpassword
//    DB_NAME=ces_db
// ─────────────────────────────────────────────────────────────

import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "ces_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
