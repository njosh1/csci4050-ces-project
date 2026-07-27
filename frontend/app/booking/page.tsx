"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

import { API_URL, getStoredUser, getToken } from "@/lib/auth";
import { formatShowtime } from "@/lib/format";

const ticketPrices = {
  adult: 14.99,
  child: 9.99,
  senior: 11.99,
};

type TicketType = keyof typeof ticketPrices;

type Tickets = Record<TicketType, number>;

type SeatsResponse = {
  movie: { id: string; title: string };
  showtime: { id: string; date: string; time: string; showroom: string };
  allSeats: string[];
  bookedSeats: string[];
};

type Step = "seats" | "summary" | "payment";

type PersistedBooking = {
  tickets: Tickets;
  seats: string[];
  step: Step;
};

const EMPTY_TICKETS: Tickets = { adult: 0, child: 0, senior: 0 };

function storageKey(movieId: string, showtimeId: string) {
  return `ces_booking_${movieId}_${showtimeId}`;
}

function sessionKey(movieId: string, showtimeId: string) {
  return `ces_session_${movieId}_${showtimeId}`;
}

function getOrCreateSessionId(movieId: string, showtimeId: string) {
  const key = sessionKey(movieId, showtimeId);
  const existing = sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  sessionStorage.setItem(key, created);
  return created;
}

function loadPersistedBooking(movieId: string, showtimeId: string): PersistedBooking | null {
  const raw = sessionStorage.getItem(storageKey(movieId, showtimeId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedBooking;
  } catch {
    return null;
  }
}

function savePersistedBooking(movieId: string, showtimeId: string, data: PersistedBooking) {
  sessionStorage.setItem(storageKey(movieId, showtimeId), JSON.stringify(data));
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="booking-page">
          <div className="booking-container">
            <p className="subtitle">Loading showtime details...</p>
          </div>
        </main>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movieId = searchParams.get("movieId") || "";
  const showtimeId = searchParams.get("showtimeId") || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [seatData, setSeatData] = useState<SeatsResponse | null>(null);

  const [tickets, setTickets] = useState<Tickets>(EMPTY_TICKETS);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("seats");
  const [reserving, setReserving] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!movieId || !showtimeId) {
      setLoadError("This booking link is missing a movie or showtime.");
      setLoading(false);
      return;
    }

    async function loadSeats() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `${API_URL}/api/bookings/${movieId}/${showtimeId}/seats`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load this showtime.");
        }

        setSeatData(data);

        const persisted = loadPersistedBooking(movieId, showtimeId);

        if (persisted) {
          setTickets(persisted.tickets);
          setSelectedSeats(persisted.seats);

          // Only resume past the seat step once the user is actually
          // logged in — the login gate is what moves them forward.
          if (persisted.step !== "seats" && getToken()) {
            setStep(persisted.step);
          }
        }

        setEmail(getStoredUser()?.email || "");
      } catch (requestError) {
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load this showtime."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, showtimeId]);

  const totalTickets = tickets.adult + tickets.child + tickets.senior;

  const totalPrice =
    tickets.adult * ticketPrices.adult +
    tickets.child * ticketPrices.child +
    tickets.senior * ticketPrices.senior;

  const seatRows = useMemo(() => {
    const rows = new Set<string>();
    const cols = new Set<number>();

    for (const seat of seatData?.allSeats || []) {
      rows.add(seat[0]);
      cols.add(Number(seat.slice(1)));
    }

    return {
      rows: [...rows].sort(),
      cols: [...cols].sort((a, b) => a - b),
    };
  }, [seatData]);

  function changeTicket(type: TicketType, amount: number) {
    setFormError("");

    setTickets((prev) => {
      const next = { ...prev, [type]: Math.max(0, prev[type] + amount) };
      const nextTotal = next.adult + next.child + next.senior;

      // Trim seats from the end if lowering the ticket count drops
      // below the number of seats already picked.
      setSelectedSeats((seats) =>
        seats.length > nextTotal ? seats.slice(0, nextTotal) : seats
      );

      return next;
    });
  }

  function toggleSeat(seat: string) {
    if (seatData?.bookedSeats.includes(seat)) {
      return;
    }

    setFormError("");

    setSelectedSeats((prev) => {
      if (prev.includes(seat)) {
        return prev.filter((s) => s !== seat);
      }

      if (prev.length >= totalTickets) {
        setFormError(
          "Increase your ticket count before selecting more seats."
        );
        return prev;
      }

      return [...prev, seat];
    });
  }

  async function handleProceedToCheckout() {
    setFormError("");

    if (totalTickets < 1) {
      setFormError("Choose at least one ticket before continuing.");
      return;
    }

    if (selectedSeats.length !== totalTickets) {
      setFormError(
        `Select exactly ${totalTickets} seat${totalTickets === 1 ? "" : "s"} to match your ticket count.`
      );
      return;
    }

    setReserving(true);

    try {
      const sessionId = getOrCreateSessionId(movieId, showtimeId);

      const response = await fetch(`${API_URL}/api/bookings/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          showtimeId,
          sessionId,
          tickets,
          seats: selectedSeats,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reserve those seats.");
      }

      savePersistedBooking(movieId, showtimeId, {
        tickets,
        seats: selectedSeats,
        step: "summary",
      });

      if (!getToken()) {
        const returnTo = `/booking?movieId=${movieId}&showtimeId=${showtimeId}`;
        router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      setStep("summary");
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reserve those seats."
      );
    } finally {
      setReserving(false);
    }
  }

  function handleContinueToPayment(event: FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      setFormError("Please confirm an email address for this order.");
      return;
    }

    setFormError("");
    savePersistedBooking(movieId, showtimeId, {
      tickets,
      seats: selectedSeats,
      step: "payment",
    });
    setStep("payment");
  }

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-container">
          <p className="subtitle">Loading showtime details...</p>
        </div>
      </main>
    );
  }

  if (loadError || !seatData) {
    return (
      <main className="booking-page">
        <div className="booking-container">
          <div className="error-banner">{loadError || "Showtime not found."}</div>
          <Link href="/" className="subtitle">
            &larr; Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="booking-container">
        <Link href={`/movies/${movieId}`} className="back-link">
          &larr; Back to {seatData.movie.title}
        </Link>

        <header className="booking-header">
          <span className="ticket-badge">SECURE TICKETING</span>
          <h1 className="gradient-title">Book Your Tickets</h1>
          <p className="subtitle">
            Select your ticket categories and reserve your preferred seating below
          </p>
        </header>

        <section className="movie-banner">
          <div className="poster">
            <span>{seatData.movie.title.slice(0, 3).toUpperCase()}</span>
          </div>

          <div className="movie-text-details">
            <h2>{seatData.movie.title}</h2>
            <div className="movie-meta-grid">
              <div className="meta-item">
                <span className="meta-label">SHOWTIME</span>
                <strong className="meta-value">
                  {seatData.showtime.date} &middot; {formatShowtime(seatData.showtime.time)}
                </strong>
              </div>

              <div className="meta-item">
                <span className="meta-label">AUDITORIUM</span>
                <strong className="meta-value">{seatData.showtime.showroom}</strong>
              </div>
            </div>
          </div>
        </section>

        {formError && <div className="error-banner">{formError}</div>}

        {step === "seats" && (
          <div className="booking-layout">
            <section className="panel">
              <h3 className="panel-title">
                <span>01</span> Choose Tickets
              </h3>

              <div className="ticket-table">
                <div className="ticket-header">
                  <span>Ticket Type</span>
                  <span>Price</span>
                  <span style={{ textAlign: "right" }}>Quantity</span>
                </div>

                <div className="ticket-item">
                  <div>
                    <strong className="ticket-type-title">Adult</strong>
                    <p className="ticket-desc">Standard general admission (Ages 18+)</p>
                  </div>
                  <span className="ticket-price">${ticketPrices.adult.toFixed(2)}</span>
                  <div className="quantity-control">
                    <button onClick={() => changeTicket("adult", -1)} aria-label="Decrease Adult tickets">-</button>
                    <span className="quantity-value">{tickets.adult}</span>
                    <button onClick={() => changeTicket("adult", 1)} aria-label="Increase Adult tickets">+</button>
                  </div>
                </div>

                <div className="ticket-item">
                  <div>
                    <strong className="ticket-type-title">Child</strong>
                    <p className="ticket-desc">Ages 3–12</p>
                  </div>
                  <span className="ticket-price">${ticketPrices.child.toFixed(2)}</span>
                  <div className="quantity-control">
                    <button onClick={() => changeTicket("child", -1)} aria-label="Decrease Child tickets">-</button>
                    <span className="quantity-value">{tickets.child}</span>
                    <button onClick={() => changeTicket("child", 1)} aria-label="Increase Child tickets">+</button>
                  </div>
                </div>

                <div className="ticket-item">
                  <div>
                    <strong className="ticket-type-title">Senior</strong>
                    <p className="ticket-desc">Ages 65+</p>
                  </div>
                  <span className="ticket-price">${ticketPrices.senior.toFixed(2)}</span>
                  <div className="quantity-control">
                    <button onClick={() => changeTicket("senior", -1)} aria-label="Decrease Senior tickets">-</button>
                    <span className="quantity-value">{tickets.senior}</span>
                    <button onClick={() => changeTicket("senior", 1)} aria-label="Increase Senior tickets">+</button>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h4>Order Summary</h4>
                <div className="summary-row">
                  <span>Total Allocated Tickets</span>
                  <strong>{totalTickets}</strong>
                </div>
                <div className="summary-row">
                  <span>Selected Seats</span>
                  <strong className="seats-list">
                    {[...selectedSeats].sort().join(", ") || "None selected"}
                  </strong>
                </div>

                <div className="total-divider"></div>

                <div className="total-row">
                  <span>Total Amount</span>
                  <strong className="final-price">${totalPrice.toFixed(2)}</strong>
                </div>
              </div>

              <button
                className="continue-button"
                disabled={reserving}
                onClick={handleProceedToCheckout}
              >
                {reserving ? "Reserving Seats..." : "Proceed to Checkout"}
              </button>
            </section>

            <section className="panel seats-panel">
              <h3 className="panel-title">
                <span>02</span> Select Seats
              </h3>

              <div className="screen-wrapper">
                <div className="screen-line"></div>
                <p className="screen-text">STAGE / SCREEN THIS WAY</p>
              </div>

              <div className="seat-legend">
                <div className="legend-item"><span className="legend-box available"></span> Available</div>
                <div className="legend-item"><span className="legend-box selected-box"></span> Selected</div>
                <div className="legend-item"><span className="legend-box unavailable"></span> Booked</div>
              </div>

              <div className="seat-map">
                {seatRows.rows.map((row) => (
                  <div
                    className="seat-row"
                    key={row}
                    style={{ gridTemplateColumns: `24px repeat(${seatRows.cols.length}, 1fr)` }}
                  >
                    <span className="row-label">{row}</span>

                    {seatRows.cols.map((num) => {
                      const seat = `${row}${num}`;
                      const selected = selectedSeats.includes(seat);
                      const isBooked = seatData.bookedSeats.includes(seat);

                      return (
                        <button
                          key={seat}
                          disabled={isBooked || (totalTickets === 0 && !selected)}
                          className={`seat ${selected ? "selected" : ""} ${isBooked ? "unavailable-seat" : ""}`}
                          onClick={() => toggleSeat(seat)}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="tip-box">
                <p className="tip-text">
                  {totalTickets === 0
                    ? "Choose at least one ticket above to start selecting seats."
                    : "Click on available seats to assign or remove them from your selection."}
                </p>
              </div>
            </section>
          </div>
        )}

        {step === "summary" && (
          <section className="panel checkout-panel">
            <h3 className="panel-title">
              <span>03</span> Order Summary
            </h3>

            <div className="summary-card">
              <h4>{seatData.movie.title}</h4>
              <div className="summary-row">
                <span>Showtime</span>
                <strong>
                  {seatData.showtime.date} &middot; {formatShowtime(seatData.showtime.time)} &middot;{" "}
                  {seatData.showtime.showroom}
                </strong>
              </div>
              <div className="summary-row">
                <span>Selected Seats</span>
                <strong className="seats-list">{[...selectedSeats].sort().join(", ")}</strong>
              </div>

              <div className="total-divider"></div>

              {(["adult", "child", "senior"] as TicketType[])
                .filter((type) => tickets[type] > 0)
                .map((type) => (
                  <div className="summary-row" key={type}>
                    <span>
                      {type[0].toUpperCase() + type.slice(1)} &times; {tickets[type]}
                    </span>
                    <strong>${(ticketPrices[type] * tickets[type]).toFixed(2)}</strong>
                  </div>
                ))}

              <div className="total-divider"></div>

              <div className="total-row">
                <span>Total Before Tax</span>
                <strong className="final-price">${totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={handleContinueToPayment} className="email-confirm">
              <label htmlFor="order-email">
                Confirm the email address for this order
              </label>
              <input
                id="order-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <button type="submit" className="continue-button">
                Proceed to Payment
              </button>
            </form>
          </section>
        )}

        {step === "payment" && (
          <section className="panel checkout-panel">
            <h3 className="panel-title">
              <span>04</span> Payment
            </h3>

            <p className="tip-text">
              Payment processing for this order will be available in the final
              release. This screen is a preview of the checkout page.
            </p>

            <div className="payment-mockup">
              <label>Card Number</label>
              <input type="text" placeholder="•••• •••• •••• ••••" disabled />

              <div className="payment-mockup-row">
                <div>
                  <label>Expiration</label>
                  <input type="text" placeholder="MM / YY" disabled />
                </div>
                <div>
                  <label>CVV</label>
                  <input type="text" placeholder="•••" disabled />
                </div>
              </div>

              <button type="button" className="continue-button" disabled>
                Payment Coming Soon
              </button>
            </div>
          </section>
        )}

        <footer className="booking-footer">
          <div className="footer-card">
            <strong>Secure Booking</strong>
          </div>
          <div className="footer-card">
            <strong>Instant Digital Delivery</strong>
          </div>
          <div className="footer-card">
            <strong>Customer Support</strong>
          </div>
        </footer>
      </div>
    </main>
  );
}
