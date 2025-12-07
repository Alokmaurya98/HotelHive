// Core Module
const path = require('path');
require("dotenv").config();


// External Module
const express = require('express');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const multer = require('multer');

// yaha smart resolve:
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;
const DB_PATH = process.env.MONGO_URI;


// Local Modules
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter")
const rootDir = require("./Utils/pathUtil");
const errorsController = require("./controllers/errors");
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.urlencoded({ extended: true }));
app.use(multer( {storage,fileFilter} ).single('photo'));
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/host/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/homes/uploads', express.static(path.join(rootDir, 'uploads')));

app.use(session({
  secret: 'Secret Key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: DB_PATH,
    collectionName: 'sessions'
  })
}));

// expose isLoggedIn to req and to all EJS views
app.use((req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn || false;
  req.isLoggedIn = isLoggedIn;        // for /host protection
  res.locals.isLoggedIn = isLoggedIn; // for EJS templates
  next();
});

app.use(storeRouter);
app.use(authRouter);

app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});

app.use("/host", hostRouter);



app.use(errorsController.pageNotFound);

const PORT = 4000;
mongoose.connect(DB_PATH).then(() => {
  console.log("Connected to mongoose successfully");
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log("Error while connecting to mongoose", err);
});
