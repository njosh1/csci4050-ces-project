require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("./models/movieModel");

const hardcodedShowtimes = [
  { time: "2:00 PM", date: "2025-07-01" },
  { time: "5:00 PM", date: "2025-07-01" },
  { time: "8:00 PM", date: "2025-07-01" },
];

const movies = [
  // ── Currently Running ────────────────────────────────────────────────────
  {
    title: "Dune: Part Two",
    description:
      "Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    genre: ["Sci-Fi", "Adventure", "Drama"],
    rating: "PG-13",
    status: "Currently Running",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    releaseYear: 2024,
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    duration: 166,
    showtimes: hardcodedShowtimes,
  },
  {
    title: "Oppenheimer",
    description:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    genre: ["Biography", "Drama", "History"],
    rating: "R",
    status: "Currently Running",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    releaseYear: 2023,
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
    duration: 180,
    showtimes: hardcodedShowtimes,
  },
  {
    title: "The Wild Robot",
    description:
      "A robot shipwrecked on a wild island must learn to adapt to its harsh surroundings and find a way to survive.",
    genre: ["Animation", "Adventure", "Family"],
    rating: "PG",
    status: "Currently Running",
    posterUrl: "/posters/TheWildRobot.jpg",
    trailerUrl: "https://www.youtube.com/embed/67vbA5ZJdKQ",
    releaseYear: 2024,
    director: "Chris Sanders",
    cast: ["Lupita Nyong'o", "Pedro Pascal", "Kit Connor"],
    duration: 102,
    showtimes: hardcodedShowtimes,
  },
  {
    title: "Gladiator II",
    description:
      "Years after the death of Maximus, Lucius is forced to enter the Colosseum and must look to his past to find strength.",
    genre: ["Action", "Adventure", "Drama"],
    rating: "R",
    status: "Currently Running",
    posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    trailerUrl: "https://www.youtube.com/embed/4rgYUipGJNo",
    releaseYear: 2024,
    director: "Ridley Scott",
    cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington"],
    duration: 148,
    showtimes: hardcodedShowtimes,
  },
  {
    title: "Inside Out 2",
    description:
      "Riley enters adolescence and her Headquarters is suddenly turned upside-down by a new and powerful emotion: Anxiety.",
    genre: ["Animation", "Comedy", "Family"],
    rating: "PG",
    status: "Currently Running",
    posterUrl: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    trailerUrl: "https://www.youtube.com/embed/LEjhY15eCx0",
    releaseYear: 2024,
    director: "Kelsey Mann",
    cast: ["Amy Poehler", "Maya Hawke", "Kensington Tallman"],
    duration: 100,
    showtimes: hardcodedShowtimes,
  },
  {
    title: "Alien: Romulus",
    description:
      "A group of young space colonizers come face to face with the most terrifying life form in the universe.",
    genre: ["Horror", "Sci-Fi", "Thriller"],
    rating: "R",
    status: "Currently Running",
    posterUrl: "https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
    trailerUrl: "https://www.youtube.com/embed/OzY2r2JXsDM",
    releaseYear: 2024,
    director: "Fede Álvarez",
    cast: ["Cailee Spaeny", "David Jonsson", "Archie Renaux"],
    duration: 119,
    showtimes: hardcodedShowtimes,
  },
  // ── Coming Soon ──────────────────────────────────────────────────────────
  {
    title: "Mission: Impossible – The Final Reckoning",
    description:
      "Ethan Hunt and his IMF team face their most dangerous mission yet in this thrilling conclusion to the saga.",
    genre: ["Action", "Thriller", "Adventure"],
    rating: "PG-13",
    status: "Coming Soon",
    posterUrl: "/posters/MissionImpossible.jpg",
    trailerUrl: "https://www.youtube.com/embed/fsQgc9pCyDU",
    releaseYear: 2025,
    director: "Christopher McQuarrie",
    cast: ["Tom Cruise", "Hayley Atwell", "Ving Rhames"],
    duration: 169,
    showtimes: [],
  },
  {
    title: "Avatar 3",
    description:
      "Jake Sully and Neytiri continue their journey across the world of Pandora, uncovering new wonders and facing new threats.",
    genre: ["Sci-Fi", "Adventure", "Fantasy"],
    rating: "PG-13",
    status: "Coming Soon",
    posterUrl: "/posters/Avatar.jpg",
    trailerUrl: "https://www.youtube.com/embed/a8Gx8wiNbs8",
    releaseYear: 2025,
    director: "James Cameron",
    cast: ["Sam Worthington", "Zoe Saldaña", "Sigourney Weaver"],
    duration: 0,
    showtimes: [],
  },
  {
    title: "Wicked: For Good",
    description:
      "The untold story of the witches of Oz continues as Elphaba and Glinda face their ultimate destinies.",
    genre: ["Musical", "Fantasy", "Drama"],
    rating: "PG",
    status: "Coming Soon",
    posterUrl: "/posters/Wicked.jpg",
    trailerUrl: "https://www.youtube.com/embed/6COmYeLsz4c",
    releaseYear: 2025,
    director: "Jon M. Chu",
    cast: ["Cynthia Erivo", "Ariana Grande", "Jonathan Bailey"],
    duration: 0,
    showtimes: [],
  },
  {
    title: "Superman",
    description:
      "Clark Kent balances his life as a reporter in Metropolis while embracing his destiny as the Man of Steel.",
    genre: ["Action", "Superhero", "Sci-Fi"],
    rating: "PG-13",
    status: "Coming Soon",
    posterUrl: "/posters/Superman.jpg",
    trailerUrl: "https://www.youtube.com/embed/Ox8ZLF6cGM0",
    releaseYear: 2025,
    director: "James Gunn",
    cast: ["David Corenswet", "Rachel Brosnahan", "Nicholas Hoult"],
    duration: 0,
    showtimes: [],
  },
  {
    title: "Jurassic World Rebirth",
    description:
      "A new expedition into the most dangerous corners of the world uncovers shocking secrets about dinosaur evolution.",
    genre: ["Action", "Adventure", "Sci-Fi"],
    rating: "PG-13",
    status: "Coming Soon",
    posterUrl: "/posters/JurassticWorld.jpg",
    trailerUrl: "https://www.youtube.com/embed/jan5CFWs9ic",
    releaseYear: 2025,
    director: "Gareth Edwards",
    cast: ["Scarlett Johansson", "Jonathan Bailey", "Mahershala Ali"],
    duration: 0,
    showtimes: [],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const deleted = await Movie.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing movie(s).`);

    const inserted = await Movie.insertMany(movies);
    console.log(`Seeded ${inserted.length} movies successfully.\n`);

    const running = inserted.filter((m) => m.status === "Currently Running").length;
    const coming = inserted.filter((m) => m.status === "Coming Soon").length;
    const genres = [...new Set(inserted.flatMap((m) => m.genre))].sort();
    console.log(`   Currently Running : ${running}`);
    console.log(`   Coming Soon       : ${coming}`);
    console.log(`   Genres covered    : ${genres.join(", ")}`);
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedDatabase();
