import { NextResponse } from "next/server";

const movies = [
  { id: 1, title: "Inception", genre: "Sci-Fi" },
  { id: 2, title: "The Dark Knight", genre: "Action" },
  { id: 3, title: "Interstellar", genre: "Sci-Fi" },
  { id: 4, title: "Avengers: Endgame", genre: "Action" },
  { id: 5, title: "Avengers: Infinity War", genre: "Action" },
  { id: 6, title: "Spider-Man: No Way Home", genre: "Action" },
  { id: 7, title: "Iron Man", genre: "Action" },
  { id: 8, title: "Captain America: Civil War", genre: "Action" },
  { id: 9, title: "The Maze Runner", genre: "Adventure" },
  { id: 10, title: "Maze Runner: The Scorch Trials", genre: "Adventure" },
  { id: 11, title: "Maze Runner: The Death Cure", genre: "Adventure" },
  { id: 13, title: "Top Gun: Maverick", genre: "Action" },
  { id: 14, title: "Jurassic World", genre: "Adventure" },
  { id: 15, title: "Avatar", genre: "Sci-Fi" },
  { id: 16, title: "Avatar: The Way of Water", genre: "Sci-Fi" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const results = movies.filter((movie) =>
    movie.title.toLowerCase().includes(query.toLowerCase())
  );

  return NextResponse.json(results);
}
