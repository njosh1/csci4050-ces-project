# Cinema E-Booking System (CES)

A full-stack web app for browsing movies, viewing showtimes, and booking seats.

**Stack:** Next.js (frontend) · Express + MongoDB Atlas (backend)

---

## Prerequisites

- Node.js v18+
- A MongoDB Atlas account (or use the shared cluster — ask Nupoor for the URI)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/njosh1/csci4050-ces-project.git
cd csci4050-ces-project
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```
MONGO_URI=<your MongoDB Atlas connection string>
PORT=5001
```

> **Mac users:** Port 5000 is taken by macOS AirPlay. Use 5001 (or any other free port) and make sure `PORT` in `.env` matches `API_URL` in the frontend files.

Start the server:

```bash
node server.js
```

You should see:
```
Server running on http://localhost:5001
Connected to MongoDB Atlas
```

### 3. Seed the database

Run this once to load all 11 movies into MongoDB:

```bash
node seed.js
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — Currently Running & Coming Soon, genre filter |
| `/movies/[id]` | Movie details — poster, description, trailer, showtimes |
| `/search` | Search movies by title |
| `/booking` | Booking UI — ticket quantities, seat selection |

---

## Project Structure

```
csci4050-ces-project/
├── backend/
│   ├── models/movieModel.js   # Mongoose schema
│   ├── server.js              # Express API (routes: /api/movies)
│   └── seed.js                # Seeds MongoDB with 11 movies
└── frontend/
    └── app/
        ├── page.tsx               # Home page
        ├── movies/[id]/page.tsx   # Movie details
        ├── search/page.tsx        # Search
        └── booking/page.tsx       # Booking UI
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/movies` | All movies |
| GET | `/api/movies/:id` | Single movie by ID |
| GET | `/api/movies/search?q=` | Search by title |
| GET | `/api/movies/filter?genre=` | Filter by genre |

---

## Team

| Name | Responsibility |
|---|---|
| Nupoor | Data seeding |
| Amit | Home page |
| Usman | Search |
| Meghana | Filter |
| Gabrielle | Booking page |
