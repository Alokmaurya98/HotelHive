const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  home: { type: mongoose.Schema.Types.ObjectId, ref: "Home", required: true }, // the booked home
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, default: 1 },
  specialRequests: { type: String },
  totalPrice: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "confirmed" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
