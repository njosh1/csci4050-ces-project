"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const ticketPrices = {
  adult: 14.99,
  child: 9.99,
  senior: 11.99,
};

const seatRows = ["A", "B", "C", "D"];
const seatNumbers = [1, 2, 3, 4, 5, 6];

type TicketType = "adult" | "child" | "senior";

export default function BookingPage() {
  const searchParams = useSearchParams();

  const movie = searchParams.get("movie") || "Avatar: The Way of Water";
  const showtime = searchParams.get("showtime") || "7:00 PM";

  const [tickets, setTickets] = useState({
    adult: 0,
    child: 0,
    senior: 0,
  });

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const changeTicket = (type: TicketType, amount: number) => {
    setTickets((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + amount),
    }));
  };

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat]
    );
  };

  const totalTickets = tickets.adult + tickets.child + tickets.senior;

  const totalPrice =
    tickets.adult * ticketPrices.adult +
    tickets.child * ticketPrices.child +
    tickets.senior * ticketPrices.senior;

  return (
    <main className="booking-page">
      <div className="booking-container">
        <header className="booking-header">
          <span className="ticket-badge">🎟️ SECURE TICKETING</span>
          <h1 className="gradient-title">Book Your Tickets</h1>
          <p className="subtitle">Select your ticket categories and reserve your preferred seating layout below</p>
        </header>

        {/* Movie Info Banner */}
        <section className="movie-banner">
          <div className="poster">
            <span>{movie.slice(0, 3).toUpperCase()}</span>
          </div>

          <div className="movie-text-details">
            <h2>{movie}</h2>
            <div className="movie-meta-grid">
              <div className="meta-item">
                <span className="meta-label">📅 SHOWTIME</span>
                <strong className="meta-value">{showtime}</strong>
              </div>

              <div className="meta-item">
                <span className="meta-label">📍 AUDITORIUM</span>
                <strong className="meta-value">Screen 1 (Laser Ultra)</strong>
              </div>
            </div>
          </div>
        </section>
        
        {/*Back to search button*/}
        <Link 
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 by-white/10 px-4 py-2 text-white transmission hov er:bg-white/20"
          >
            ⏮️ Back to Search
          </Link>

        {/* Main Interface Split */}
        <div className="booking-layout">
          
          {/* Left Panel: Ticket Quantities & Checkout Summary */}
          <section className="panel">
            <h3 className="panel-title"><span>01</span> Choose Tickets</h3>

            <div className="ticket-table">
              <div className="ticket-header">
                <span>Ticket Type</span>
                <span>Price</span>
                <span style={{ textAlign: 'right' }}>Quantity</span>
              </div>

              {/* Adult Category */}
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

              {/* Child Category */}
              <div className="ticket-item">
                <div>
                  <strong className="ticket-type-title">Child</strong>
                  <p className="ticket-desc">Ages 3–12. Under 3 are free</p>
                </div>
                <span className="ticket-price">${ticketPrices.child.toFixed(2)}</span>
                <div className="quantity-control">
                  <button onClick={() => changeTicket("child", -1)} aria-label="Decrease Child tickets">-</button>
                  <span className="quantity-value">{tickets.child}</span>
                  <button onClick={() => changeTicket("child", 1)} aria-label="Increase Child tickets">+</button>
                </div>
              </div>

              {/* Senior Category */}
              <div className="ticket-item">
                <div>
                  <strong className="ticket-type-title">Senior</strong>
                  <p className="ticket-desc">Ages 65+ with valid identity verification</p>
                </div>
                <span className="ticket-price">${ticketPrices.senior.toFixed(2)}</span>
                <div className="quantity-control">
                  <button onClick={() => changeTicket("senior", -1)} aria-label="Decrease Senior tickets">-</button>
                  <span className="quantity-value">{tickets.senior}</span>
                  <button onClick={() => changeTicket("senior", 1)} aria-label="Increase Senior tickets">+</button>
                </div>
              </div>
            </div>

            {/* Dynamic Summary Section */}
            <div className="summary-card">
              <h4>Order Summary</h4>
              <div className="summary-row">
                <span>Total Allocated Tickets</span>
                <strong>{totalTickets}</strong>
              </div>
              <div className="summary-row">
                <span>Selected Seats</span>
                <strong className="seats-list">{selectedSeats.sort().join(", ") || "None selected"}</strong>
              </div>

              <div className="total-divider"></div>

              <div className="total-row">
                <span>Total Amount</span>
                <strong className="final-price">${totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <button className="continue-button">
              Proceed to Secure Checkout
            </button>
          </section>

          {/* Right Panel: Interactive Seating Matrix */}
          <section className="panel seats-panel">
            <h3 className="panel-title"><span>02</span> Select Seats</h3>

            {/* Simulated Curved Cinema Screen */}
            <div className="screen-wrapper">
              <div className="screen-line"></div>
              <p className="screen-text">STAGE / SCREEN THIS WAY</p>
            </div>

            {/* Interactive Status Color Legends */}
            <div className="seat-legend">
              <div className="legend-item"><span className="legend-box available"></span> Available</div>
              <div className="legend-item"><span className="legend-box selected-box"></span> Selected</div>
              <div className="legend-item"><span className="legend-box unavailable"></span> Occupied</div>
            </div>

            {/* Interactive Seat Generation Grid */}
            <div className="seat-map">
              {seatRows.map((row) => (
                <div className="seat-row" key={row}>
                  <span className="row-label">{row}</span>

                  {seatNumbers.map((num) => {
                    const seat = `${row}${num}`;
                    const selected = selectedSeats.includes(seat);
                    // Mocking seat B3 and B4 as unavailable for visual fidelity
                    const isUnavailable = seat === "B3" || seat === "B4";

                    return (
                      <button
                        key={seat}
                        disabled={isUnavailable}
                        className={`seat ${selected ? "selected" : ""} ${isUnavailable ? "unavailable-seat" : ""}`}
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
              <span className="tip-icon">💡</span>
              <p className="tip-text">Click on available seats to assign or remove them from your current selection block.</p>
            </div>
          </section>
        </div>

        {/* Trust Badges and Security Block Footer */}
        <footer className="booking-footer">
          <div className="footer-card">
            <span className="footer-icon">🎬</span>
            <div>
              <strong>Now Showing</strong>
              <p>Discover the latest releases on the big screen</p>
            </div>
          </div>
          <div className="footer-card">
            <span className="footer-icon">⚡️</span>
            <div>
              <strong>Instant Digital Delivery</strong>
              <p>Your tickets will instantly populate inside your digital dashboard.</p>
            </div>
          </div>
          <div className="footer-card">
            <span className="footer-icon">💬</span>
            <div>
              <strong>Dedicated Concierge Support</strong>
              <p>Experiencing booking friction? Contact customer care 24/7.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}