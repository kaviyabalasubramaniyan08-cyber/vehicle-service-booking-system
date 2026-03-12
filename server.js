const express = require("express");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Parse JSON & form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Memory storage for bookings
let bookings = [];

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
// Signup page
app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});

// Login page
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Book Service route
app.post("/api/bookings", (req, res) => {
  const booking = {
    id: Date.now().toString(),
    vehicleNumber: req.body.vehicleNumber,
    serviceType: req.body.serviceType,
    date: req.body.date,
    time: req.body.time,
    status: "Pending"
  };

  bookings.push(booking);
  console.log("Booking received:", booking);

  res.json({ message: "Booking received successfully", booking });
});

// View Status route
app.get("/api/bookings/:vehicleNumber", (req, res) => {
  const vehicleNum = req.params.vehicleNumber.toLowerCase().trim();
  const booking = bookings.find(
    b => b.vehicleNumber.toLowerCase().trim() === vehicleNum
  );

  console.log("Fetching booking for:", vehicleNum, "Found:", booking);

  if (booking) res.json(booking);
  else res.status(404).json({ message: "Booking Not Found" });
});

// Get all bookings (for admin dashboard)
app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

// Update booking status (for admin dashboard)
app.post("/api/bookings/:vehicleNumber/status", (req, res) => {
  const vehicleNum = req.params.vehicleNumber.toLowerCase().trim();
  const booking = bookings.find(
    b => b.vehicleNumber.toLowerCase().trim() === vehicleNum
  );

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  booking.status = req.body.status; // e.g., "Completed"
  console.log(`Booking ${vehicleNum} status updated to ${booking.status}`);
  res.json({ message: "Status updated", booking });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

