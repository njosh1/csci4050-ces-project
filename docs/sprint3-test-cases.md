# Sprint 3 Test Cases

Manual test cases for the Admin Portal and Users' Portal features covered in
this deliverable (Add Movie, Schedule Showtimes, Showtime Visibility, Start
Booking, Seat Map, Seat Selection, Checkout). Run against a freshly seeded
database (`npm run seed` in `backend/`).

## Admin — Add Movie

| # | Steps | Expected Result |
|---|-------|------------------|
| 1 | As an Admin, submit the Add Movie form with title, description, genre, rating, status, poster URL, and trailer URL filled in. | Movie is created (201) and appears in the catalog list and on the public home page. |
| 2 | Submit the form with the title left blank. | Request is rejected (400) with a message naming the required fields; no movie is created. |
| 3 | Add a movie whose title matches an existing movie (case-insensitive). | Request is rejected (409, "A movie with this title already exists."). |

## Admin — Schedule Showtimes

| # | Steps | Expected Result |
|---|-------|------------------|
| 4 | Add a showtime for a movie with a date, time, and one of the three showrooms. | Showtime is added (201) and appears under that movie in both the admin showtimes list and the movie's public detail page. |
| 5 | Add a showtime with the date/time left blank. | Request is rejected (400, "Showtime date, time, and showroom are required."). |
| 6 | Add a showtime dated in the past. | Request is rejected (400, "Showtime must be a valid future date and time."). |
| 7 | Add a showtime for Showroom 1 at a date/time that another movie already has booked in Showroom 1. | Request is rejected (409) naming the conflicting showroom, date, and time. |
| 8 | Add a showtime for the same date/time as an existing showtime but in a different showroom. | Request succeeds — showroom is part of the conflict key, so no false conflict. |
| 9 | Confirm the seed data covers Showroom 1, 2, and 3 with no conflicts. | `npm run seed` completes without errors; each showroom has at least one seeded showtime. |

## Users — Showtime Visibility

| # | Steps | Expected Result |
|---|-------|------------------|
| 10 | Load the home page as a signed-out visitor. | "Currently Running" and "Coming Soon" sections render, each movie card lists its real showtimes pulled from MongoDB. |
| 11 | Open a "Coming Soon" movie (no showtimes yet). | Movie detail page shows "No showtimes yet. This movie is coming soon." instead of a broken list. |

## Users — Start Booking / Seat Map / Seat Selection

| # | Steps | Expected Result |
|---|-------|------------------|
| 12 | From a movie's detail page, click a showtime. | Navigates to `/booking?movieId=...&showtimeId=...` with the real IDs, not the movie title/time text. |
| 13 | On the booking page, set ticket counts to 2 adult before selecting any seats. | Seat map loads showing real availability for that specific showtime; up to 2 seats can be selected. |
| 14 | Try selecting a 3rd seat while only 2 tickets are chosen. | Selection is blocked with an inline message asking to increase the ticket count first. |
| 15 | Lower the ticket count after already selecting seats up to the old count. | Extra selected seats beyond the new count are automatically dropped. |
| 16 | Reserve seats for a showtime from one browser, then load the same showtime in a second browser/incognito window. | The seats reserved by the first session appear disabled ("Booked") and cannot be selected in the second session. |
| 17 | Attempt to reserve a seat that was just booked by someone else (race condition). | `POST /api/bookings/reserve` rejects with 409 ("One or more seats were already reserved."). |
| 18 | Click "Proceed to Checkout" with 0 tickets selected. | Blocked with an inline message; no reservation request is sent. |

## Users — Checkout / Login Gate / Order Summary

| # | Steps | Expected Result |
|---|-------|------------------|
| 19 | While signed out, pick tickets/seats and click "Proceed to Checkout". | Seats are reserved for the session, then the user is redirected to `/login` before seeing the order summary. |
| 20 | Log in from that redirect. | User is returned to the booking page and lands directly on the Order Summary step with the same seats/tickets intact. |
| 21 | Review the Order Summary step. | Movie name, showtime, selected seats, ticket breakdown, price per ticket, and total price before tax are all displayed. |
| 22 | Confirm or edit the pre-filled email address, then continue. | Proceeds to the payment (mockup) step; a blank email is rejected first. |
| 23 | View the payment step. | A mockup payment form is shown with a note that payment processing is not yet implemented. |

## NFR Checks

| # | Steps | Expected Result |
|---|-------|------------------|
| 24 | Submit any admin form (movie, showtime, promotion) with invalid data. | Client-side `required` validation blocks the submit; if bypassed, the server responds 400 with a specific message rather than a generic error. |
| 25 | Send a malformed ObjectId to any `/api/admin/movies/:id` route. | Global error handler returns 400 ("Invalid identifier provided.") instead of a 500. |
