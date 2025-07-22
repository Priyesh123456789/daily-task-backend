// server.js

// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file

// Import User model (ADD THIS LINE)
const User = require('./models/User'); 

const app = express();
const PORT = process.env.PORT || 5000; // Server will run on port 5000 (or whatever is set in .env)

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend communication
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
// The URI should match what you see in MongoDB Compass or your .env file
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyTasksDB'; 

mongoose.connect(uri)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic route for testing the server
app.get('/', (req, res) => {
    res.send('Task App Backend is running!');
});

// User Authentication Routes (ADD THESE ROUTES)
// Register User
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body; // Get username and password from request body

    try {
        // Check if user already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user (password will be hashed by pre-save middleware in User.js)
        const user = await User.create({ username, password });

        res.status(201).json({
            message: 'User registered successfully',
            _id: user._id,
            username: user.username
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Use generic message for security
        }

        // Check if password matches
        // user.matchPassword is a method defined in models/User.js
        const isMatch = await user.matchPassword(password); 
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' }); // Use generic message for security
        }

        // User is authenticated, generate a token (we'll add JWT later)
        // For now, we'll just send success message
        res.status(200).json({
            message: 'Logged in successfully',
            _id: user._id,
            username: user.username,
            // token: generateToken(user._id) // We'll add this later with jsonwebtoken
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});