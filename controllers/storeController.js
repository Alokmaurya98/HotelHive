const Home = require("../models/home");
const User = require("../models/user");
const Booking = require("../models/bookings");
const fs=require('fs');
const path=require('path');
const mongoose = require("mongoose");

exports.getIndex = (req, res, next) => {
  Home.find().then(registeredHomes=>{
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "Elite Homes",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    })
  });
};

exports.getHomes = (req, res, next) => {
   Home.find().then(registeredHomes=>{
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    })
});
};

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  })
};

exports.getFavouriteList = async(req, res, next) => {
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate('favourites');
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn, 
    user: req.session.user,
  });
};
exports.getBookings = async(req, res, next) => {
   try {
    if (!req.session?.user?._id) {
      return res.redirect('/login'); // or render message
    }

    const userId = req.session.user._id;

    // find bookings for logged-in user and populate the home
    const bookings = await Booking.find({ user: userId })
      .populate('home')         // make sure Booking model has ref: 'Home'
      .sort({ createdAt: -1 });

    res.render('store/bookings', {
      pageTitle: 'My Bookings',
      currentPage: 'bookings',
      bookings,
      user: req.session.user,
      isLoggedIn: req.isLoggedIn
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.gethomDetails = (req, res, next) => {
const homeId=req.params.homeId;
console.log(homeId);
Home.findById(homeId).then(home=>{
  if(!home){
    console.log("Home not found");
    res.redirect("/homes");
  }else{
  console.log("Home details",home);
  res.render("store/home-detail", {
      home:home,
      pageTitle: "Home Details",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    })
  }
})
};
exports.getBookingDetails = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate('home');

    if (!booking) return res.status(404).send('Booking not found');

    // security: only owner can view
    if (!req.session?.user?._id || booking.user?.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Not allowed');
    }

    res.render('store/booking-details', {
      pageTitle: 'Booking Details',
      currentPage: 'booking-details',
      booking,
      home: booking.home,
      user: req.session.user,
      isLoggedIn: req.isLoggedIn
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
exports.getReserve = async(req, res, next) => {
  const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) {
       return res.status(404).render("404");
    }

 res.render("store/reserve", {
    home: home,
    pageTitle: "Reserve",
    currentPage: "reserve",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  })
};

exports.postAddtoFavourites = async(req, res, next) => {
  const homeId = req.body.id;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }
  res.redirect("/favourites");
}
exports.postRemoveFromFavourite = async(req, res, next) => {
  const homeId = req.params.homeId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter(fav => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
}


exports.postReserve =async (req, res, next) => {
  const {
    homeId,        // <--- matches your reserve.ejs hidden input
    fullName,
    email,
    phone,
    checkIn,
    checkOut,
    guests,
    rooms,
    specialRequests
  } = req.body;

  // Basic validation
  if (!homeId || !fullName || !email || !checkIn || !checkOut) {
    return res.status(422).send("Please fill required fields");
  }
const start = new Date(checkIn);
  start.setHours(0,0,0,0);
  const end = new Date(checkOut);
  end.setHours(0,0,0,0);

  if (end <= start) return res.status(400).send("Invalid dates");

  const session = await mongoose.startSession();
 try {
    session.startTransaction();

    // ensure home exists
    const home = await Home.findById(homeId).session(session);
    if (!home) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send("Home not found");
    }

    // overlap query (same home + overlapping dates)
    const overlapQuery = {
      home: home._id,
      checkIn: { $lt: end },   // existing.checkIn < newCheckOut
      checkOut: { $gt: start } // existing.checkOut > newCheckIn
    };

    const conflict = await Booking.findOne(overlapQuery).session(session);
    if (conflict) {
      await session.abortTransaction();
      session.endSession();
     const formattedStart = start.toDateString();
const formattedEnd = end.toDateString();

return res.status(409).render("store/booking-error", {
  pageTitle: "Already Booked",
  currentPage: "booking-error",
  message: `The home is not available from ${formattedStart} to ${formattedEnd}.`,
  home,
  user: req.session.user,
  isLoggedIn: req.isLoggedIn
});


    }

    // calculate price
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.round((end - start) / msPerDay);
    const pricePerNight = Number(home.price) || 0;
    const totalPrice = nights * pricePerNight * (Number(rooms) || 1);
    
      // create booking
      const booking = new Booking({
        user: req.session?.user?._id || null,
        home: home._id,
        fullname: fullName,
        email,
        phone,
        checkIn: start,
        checkOut: end,
        guests: Number(guests) || 1,
        rooms: Number(rooms) || 1,
        specialRequests: specialRequests || "",
        totalPrice,
        status: "confirmed"
      });
await booking.save({ session });

    // optionally push booking id to user
    if (req.session?.user?._id) {
      await User.findByIdAndUpdate(
        req.session.user._id,
        { $push: { bookings: booking._id } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // render confirmation
    return res.render("store/bookingconfirmed", {
      pageTitle: "Booking Confirmed",
      currentPage: "booking-confirmed",
      booking,
      home,
      user: req.session.user,
      isLoggedIn: req.isLoggedIn
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Booking error:", err);
    return next(err);
  }
};
      
      