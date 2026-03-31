const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors"); // CORS மிக முக்கியம்

const app = express();

// 1. MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vehicle_db';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => {
    console.error('❌ Database Connection Error:', err);
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Booking = mongoose.model('Booking', bookingSchema);

// Middlewares
app.use(cors()); // எல்லா இடத்திலிருந்தும் டேட்டாவை எடுக்க அனுமதிக்கும்
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

// --- API Routes ---

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
    res.status(201).json({ message: "Booking saved", booking: savedBooking });
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ message: "Error saving booking" });
  }
});

// 4. View Status
app.get("/api/bookings/:vehicleNumber", async (req, res) => {
  const vehicleNum = req.params.vehicleNumber.trim();
  try {
    const booking = await Booking.findOne({ 
      vehicleNumber: { $regex: new RegExp("^" + vehicleNum + "$", "i") } 
    });
    if (booking) res.json(booking);
    else res.status(404).json({ message: "Not Found" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// 5. Get All Bookings (அட்மின் டேஷ்போர்டுக்காக)
app.get("/api/bookings", async (req, res) => {
  try {
    const allBookings = await Booking.find().sort({ createdAt: -1 });
    // ஒருவேளை டேட்டா இல்லையென்றால் காலியான அரே [] அனுப்பும், அப்போது 'forEach' எரர் வராது
    res.status(200).json(allBookings || []);
  } catch (err) {
    console.error("Fetch All Error:", err);
    res.status(500).json([]); // எரர் வந்தாலும் [] அனுப்புவது பாதுகாப்பானது
  }
});

// 6. Update Status
app.post("/api/bookings/:vehicleNumber/status", async (req, res) => {
  const vehicleNum = req.params.vehicleNumber.trim();
  try {
    const updatedBooking = await Booking.findOneAndUpdate(
      { vehicleNumber: { $regex: new RegExp("^" + vehicleNum + "$", "i") } },
      { status: req.body.status },
      { new: true }
    );
    if (!updatedBooking) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ message: "Error updating" });
  }
});

// Server Initialization
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
