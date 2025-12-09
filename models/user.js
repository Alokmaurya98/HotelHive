const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName:{
    type: String,
    required: [true, 'First name is required']
  },
  lastName:{
    type: String,
  },
  email:{
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  password:{ 
    type: String,
    required: [true, 'Password is required']
  },
  userType:{
    type: String,
    enum: ['guest', 'host'],
    default: 'guest'
  },
  favourites :{
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Home',
    default: []
  },
  Bookings: {
  type: [mongoose.Schema.Types.ObjectId],
  ref: "Booking",
  default: []
}

});
module.exports = mongoose.model("User", userSchema);