-- ============================================================
--  Cinema E-Booking System (CES) – Database Setup
--  Run this file once to create and seed the database.
--  Usage: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS ces_db;
USE ces_db;

-- Drop and recreate the movies table for a clean setup
DROP TABLE IF EXISTS movies;

CREATE TABLE movies (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  genre       VARCHAR(100)  NOT NULL,
  rating      VARCHAR(10)   NOT NULL,         -- e.g. PG-13, R, PG
  description TEXT          NOT NULL,
  poster_url  VARCHAR(500)  DEFAULT NULL,     -- link to poster image
  trailer_url VARCHAR(500)  DEFAULT NULL,     -- YouTube embed URL
  status      ENUM('currently_running', 'coming_soon') NOT NULL DEFAULT 'currently_running',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  Seed Data – 12 movies (mixed genres + both statuses)
-- ============================================================

INSERT INTO movies (title, genre, rating, description, poster_url, trailer_url, status) VALUES

-- Currently Running
('Inception',
 'Sci-Fi',
 'PG-13',
 'A skilled thief is offered a chance to have his criminal record erased if he can successfully perform inception: planting an idea into someone''s mind.',
 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
 'https://www.youtube.com/embed/YoHD9XEInc0',
 'currently_running'),

('The Dark Knight',
 'Action',
 'PG-13',
 'Batman raises the stakes in his war on crime as the Joker, a criminal mastermind, wreaks havoc and chaos on the people of Gotham City.',
 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
 'https://www.youtube.com/embed/EXeTwQWrcwY',
 'currently_running'),

('Interstellar',
 'Sci-Fi',
 'PG-13',
 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival as Earth faces an environmental catastrophe.',
 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
 'https://www.youtube.com/embed/zSWdZVtXT7E',
 'currently_running'),

('Top Gun: Maverick',
 'Action',
 'PG-13',
 'After more than thirty years of service, Pete "Maverick" Mitchell is still pushing the envelope as a top naval aviator.',
 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
 'https://www.youtube.com/embed/giXco2jaZ_4',
 'currently_running'),

('Spider-Man: No Way Home',
 'Action',
 'PG-13',
 'Peter Parker''s secret identity is revealed, and he seeks help from Doctor Strange, setting off a multiverse of consequences.',
 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
 'https://www.youtube.com/embed/JfVOs4VSpmA',
 'currently_running'),

('Avatar: The Way of Water',
 'Sci-Fi',
 'PG-13',
 'Jake Sully and his family do what it takes to stay alive and fight to keep each other safe as they face a familiar threat on Pandora.',
 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
 'https://www.youtube.com/embed/d9MyW72ELq0',
 'currently_running'),

('The Maze Runner',
 'Adventure',
 'PG-13',
 'Thomas is deposited in a community of boys after his memory is erased, and he must work with them to escape a deadly maze.',
 'https://image.tmdb.org/t/p/w500/ode14q7WtDugFDp78fo9lCsmay9.jpg',
 'https://www.youtube.com/embed/AwwIHAoRfkY',
 'currently_running'),

-- Coming Soon
('Avengers: Secret Wars',
 'Action',
 'PG-13',
 'The Avengers face their most devastating threat yet as the multiverse collapses and heroes from every reality must unite.',
 NULL,
 NULL,
 'coming_soon'),

('Jurassic World: Rebirth',
 'Adventure',
 'PG-13',
 'A new expedition ventures into uncharted territory where dinosaurs have evolved beyond anything scientists imagined.',
 NULL,
 NULL,
 'coming_soon'),

('Mission: Impossible 8',
 'Action',
 'PG-13',
 'Ethan Hunt faces an impossible mission that will force him to question everything and everyone he has ever trusted.',
 NULL,
 NULL,
 'coming_soon'),

('The Batman: Part II',
 'Action',
 'PG-13',
 'Bruce Wayne continues his war on crime in Gotham as new and more dangerous villains emerge from the shadows.',
 NULL,
 NULL,
 'coming_soon'),

('Dune: Messiah',
 'Sci-Fi',
 'PG-13',
 'Paul Atreides, now Emperor, grapples with the terrible power he has unleashed and the prophecy that haunts him.',
 NULL,
 NULL,
 'coming_soon');
