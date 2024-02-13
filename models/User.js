const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  }
});

module.exports = mongoose.model('User', UserSchema);