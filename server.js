// server.js

// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // To load environment variables from .env file

// Import User and Task models
const User = require('./models/user'); 
const Task = require('./models/Task'); // NEW: Task model import
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

// NEW: Authentication Middleware
// This middleware will protect routes, ensuring only authenticated users can access them.
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (without password)
            req.user = await User.findById(decoded.id).select('-password');
            
            // If user not found, throw error
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
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

        const isMatch = await user.matchPassword(password); 
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' }); 
        }

        // User is authenticated, generate a token
        res.status(200).json({
            message: 'Logged in successfully',
            _id: user._id,
            username: user.username,
            token: generateToken(user._id), 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// NEW: Task Management Routes (Protected by 'protect' middleware)

// @route   POST /api/tasks
// @desc    Add a new task for the authenticated user
// @access  Private
app.post('/api/tasks', protect, async (req, res) => {
    const { text, category, customCategoryName, date } = req.body;

    // Basic validation
    if (!text || !category || !date) {
        return res.status(400).json({ message: 'Please provide task text, category, and date.' });
    }
    if (category === 'custom' && !customCategoryName) {
        return res.status(400).json({ message: 'Custom category name is required for custom tasks.' });
    }

    try {
        const newTask = new Task({
            userId: req.user._id, // Get user ID from the 'protect' middleware
            text,
            category,
            customCategoryName: category === 'custom' ? customCategoryName : undefined,
            date
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask); // Return the saved task
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ message: 'Server error while adding task.', error: error.message });
    }
});

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user for a specific date
// @access  Private
app.get('/api/tasks', protect, async (req, res) => {
    const { date } = req.query; // Get date from query parameter (e.g., /api/tasks?date=2025-07-25)

    if (!date) {
        return res.status(400).json({ message: 'Date query parameter is required.' });
    }

    try {
        // Find tasks for the authenticated user and the specific date
        const tasks = await Task.find({ userId: req.user._id, date: date }).sort({ createdAt: 1 });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error while fetching tasks.', error: error.message });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task (e.g., mark as completed) for the authenticated user
// @access  Private
app.put('/api/tasks/:id', protect, async (req, res) => {
    const { text, category, customCategoryName, completed, date } = req.body;
    const taskId = req.params.id;

    try {
        let task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        // Ensure the task belongs to the authenticated user
        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this task.' });
        }

        // Update fields if they are provided in the request body
        task.text = text !== undefined ? text : task.text;
        task.category = category !== undefined ? category : task.category;
        task.customCategoryName = customCategoryName !== undefined ? customCategoryName : task.customCategoryName;
        task.completed = completed !== undefined ? completed : task.completed;
        task.date = date !== undefined ? date : task.date;


        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task.', error: error.message });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task for the authenticated user
// @access  Private
app.delete('/api/tasks/:id', protect, async (req, res) => {
    const taskId = req.params.id;

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        // Ensure the task belongs to the authenticated user
        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this task.' });
        }

        await Task.deleteOne({ _id: taskId }); // Use deleteOne or findByIdAndDelete
        res.status(200).json({ message: 'Task removed successfully.' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error while deleting task.', error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
