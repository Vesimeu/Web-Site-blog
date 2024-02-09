const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/User'); // This should point to your User model file
const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware configuration
app.use(express.urlencoded({ extended: true })); // Place this before your routes.

app.use(session({
  secret: '4ab7c52e560953394292e01432a1c76a4b1e97f4fddb7f75dddcd3760754807230d72c49116951277f2f6b0117ab87b9ec33b979bf8f4103512421793ac0cb8d',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // for HTTPS set secure: true
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected successfully to the local MongoDB database.");
});


// User registration route
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      nickname: req.body.nickname,
      password: hashedPassword
    });
    await user.save();
    res.redirect('/login'); // Redirect to login page after registration
  } catch {
    res.redirect('/register'); // On failure, redirect back to registration form
  }
});

// User login route
app.post('/login', async (req, res) => {
  const user = await User.findOne({ nickname: req.body.nickname });
  if (user) {
    const match = await bcrypt.compare(req.body.password, user.password);
    if (match) {
      req.session.userId = user._id; // Start a session
      res.redirect('/'); // Redirect to home page after login
    } else {
      res.redirect('/login'); // Passwords do not match, redirect back to login
    }
  } else {
    res.redirect('/login'); // User not found, redirect back to login
  }
});

// Static files
app.use(express.static('public'));

// Server start
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
