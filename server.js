// server.js

// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file

// Import User model (ensure this path is correct and case-sensitive)
const User = require('./models/user'); // Corrected path to './models/user'

const jwt = require('jsonwebtoken'); // Import jsonwebtoken 

const app = express();
const PORT = process.env.PORT || 5000; // Server will run on port 5000 (or whatever is set in .env)

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend communication
app.use(express.json()); // To parse JSON request bodies

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyTasksDB'; 

mongoose.connect(uri)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Function to generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token will expire in 30 days
    });
};

// Basic route for testing the server
app.get('/', (req, res) => {
    res.send('Task App Backend is running!');
});

// User Authentication Routes
// Register User
app.post('/api/auth/register', async (req, res) => {
    const { username, email, fullName, mobileNumber, password } = req.body;

    if (!username || !email || !fullName || !password) {
        return res.status(400).json({ message: 'Please enter all required fields (username, email, full name, password).' });
    }

    try {
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        const newUser = new User({
            username,
            email,
            fullName,
            mobileNumber, 
            password 
        });

        await newUser.save(); 

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' }); 
        }

        const isMatch = await user.matchPassword(password); // User.js में matchPassword मेथड का उपयोग
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' }); 
        }

        // User is authenticated, generate a token
        res.status(200).json({
            message: 'Logged in successfully',
            _id: user._id,
            username: user.username,
            token: generateToken(user._id), // JWT टोकन जनरेट और भेजा जा रहा है
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
