const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Assuming you are using bcryptjs for password hashing

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true // Remove whitespace from both ends of a string
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Store emails in lowercase
        match: [/.+@.+\..+/, 'Please fill a valid email address'] // Basic email validation
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: false, // Making it optional for now, can be changed to true
        trim: true,
        // You can add a regex for mobile number validation if needed
        // match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number']
    },
    password: {
        type: String,
        required: true
    },
    // You can add other fields here later if needed, e.g., createdAt, lastLogin
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps automatically

// Hash password before saving the user
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
