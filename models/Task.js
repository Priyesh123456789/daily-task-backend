// daily-task-backend/models/Task.js

const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // यह User मॉडल की _id को रेफर करेगा
        required: true,
        ref: 'User' // यह बताता है कि यह User मॉडल से जुड़ा है
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['study', 'homework', 'custom'], // या आपकी कस्टम कैटेगरी
        default: 'study'
    },
    customCategoryName: { // कस्टम कैटेगरी के लिए नाम स्टोर करने के लिए
        type: String,
        required: function() { return this.category === 'custom'; }, // अगर कैटेगरी 'custom' है तो यह ज़रूरी है
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    date: { // किस दिन का टास्क है
        type: String, // YYYY-MM-DD फॉर्मेट में स्टोर करेंगे
        required: true
    }
}, { timestamps: true }); // createdAt और updatedAt टाइमस्टैम्प जोड़ता है

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;