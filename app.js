const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/User'); 
const app = express();
const PORT = process.env.PORT || 3000;

//validotor 
const { body, validationResult } = require('express-validator');
const registrationValidationRules = [
  body('name').not().isEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('username').not().isEmpty().withMessage('Username is required'),
  body('age').isInt({ min: 18 }).withMessage('Must be at least 18 years old'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


// Session middleware configuration
app.use(express.urlencoded({ extended: true })); // Place this before your routes.

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).send('Something broke!');
});

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


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
      return next();
  } else {
      return res.status(401).send('You are not authorized to perform this action.');
  }
}

// Apply the middleware to the route that handles news submission
app.post('/submit-news', isAuthenticated, (req, res) => {
  // Handle news submission here
});

app.get('/auth-status', async (req, res) => {
  if (req.session && req.session.userId) {
      try {
          const user = await User.findById(req.session.userId);
          if (user) {
              res.json({ isAuthenticated: true, username: user.nickname });
          } else {
              // In case the user is not found in the database but the session exists
              res.json({ isAuthenticated: false });
          }
      } catch (error) {
          console.error("Error fetching user information:", error);
          res.status(500).send('Server error');
      }
  } else {
      res.json({ isAuthenticated: false });
  }
});


// User registration route
app.post('/register', registrationValidationRules, async (req, res) => {
  // Log received registration data for debugging
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, username, age, gender, password } = req.body;
  if (!name || !email || !username || !age || !gender || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check for existing user by email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all fields
    const newUser = new User({
      name,
      email,
      username,
      age,
      gender,
      password: hashedPassword
    });

    // Save the new user to the database
    await newUser.save();

    // Respond with a success message
    res.json({ success: 'User registered successfully' });

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: 'Error registering new user' });
  }
});


app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
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

app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'nickname'); // Retrieve all users with only the nickname field
    res.json(users);
  } catch (error) {
    res.status(500).send('Server error');
  }
});


// Static files
app.use(express.static('public'));

// Server start
app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
