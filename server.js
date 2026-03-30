const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// 1. MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/vehicle_db')
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => {
    console.error('❌ Database Connection Error:', err);
    process.exit(1); 
  });

// 2. Booking Schema & Model
const bookingSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, trim: true },
  serviceType: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
}, {
  // This allows the frontend to see '_id' as 'id'
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to convert _id to id
bookingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Booking = mongoose.model('Booking', bookingSchema);

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Page Routes ---

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// --- API Routes (Data Handling) ---

// 3. Create New Booking
app.post("/api/bookings", async (req, res) => {
  try {
    const newBooking = new Booking({
      vehicleNumber: req.body.vehicleNumber,
      serviceType: req.body.serviceType,
      date: req.body.date,
      time: req.body.time
    });

    const savedBooking = await newBooking.save();
    console.log("New booking saved:", savedBooking);
    
    res.json({ 
      message: "Booking received and saved successfully", 
      booking: savedBooking 
    });
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ message: "Error saving booking to database" });
  }
});

// 4. View Booking Status (Search by Vehicle Number)
app.get("/api/bookings/:vehicleNumber", async (req, res) => {
  const vehicleNum = req.params.vehicleNumber.trim();
  
  try {
    const booking = await Booking.findOne({ 
      vehicleNumber: { $regex: new RegExp("^" + vehicleNum + "$", "i") } 
    });

    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: "Booking Not Found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching booking status" });
  }
});

// 5. Get All Bookings (For Admin Dashboard)
app.get("/api/bookings", async (req, res) => {
  try {
    const allBookings = await Booking.find().sort({ createdAt: -1 });
    res.json(allBookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all bookings" });
  }
});

// 6. Update Booking Status (For Admin Approval/Rejection)
app.post("/api/bookings/:vehicleNumber/status", async (req, res) => {
  const vehicleNum = req.params.vehicleNumber.trim();
  try {
    const updatedBooking = await Booking.findOneAndUpdate(
      { vehicleNumber: { $regex: new RegExp("^" + vehicleNum + "$", "i") } },
      { status: req.body.status },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log(`Vehicle ${vehicleNum} status updated to: ${updatedBooking.status}`);
    res.json({ message: "Status updated", booking: updatedBooking });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Error updating status" });
  }
});

// Server Initialization
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
