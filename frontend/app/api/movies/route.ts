// app/api/movies/route.ts
// ─────────────────────────────────────────────────────────────
//  GET /api/movies
//  Returns all movies from the database, split by status.
//  Query params:
//    ?status=currently_running   → only running movies
//    ?status=coming_soon         → only coming soon movies
//    (no param)                  → all movies
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = "SELECT * FROM movies";
    const params: string[] = [];

    if (status === "currently_running" || status === "coming_soon") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY id ASC";

    const [rows] = await pool.execute(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies. Check your database connection." },
      { status: 500 }
    );
  }
}
