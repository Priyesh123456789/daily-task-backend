// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Username must be unique
        trim: true,  // Remove whitespace
        minlength: 3 // Minimum length of 3 characters
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum length of 6 characters for password
    },
    // We can add other user-specific data later if needed
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

// Hash the password before saving the user (middleware)
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) { // Only hash if password is new or has been modified
        const salt = await bcrypt.genSalt(10); // Generate a salt (random string)
        this.password = await bcrypt.hash(this.password, salt); // Hash the password with the salt
    }
    next(); // Continue to the next middleware or save operation
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;