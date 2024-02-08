const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

//connect BD
mongoose.connect('mongodb://localhost:27017');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Connected successfully to the local MongoDB database.");
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
