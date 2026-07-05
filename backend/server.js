const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db'); // 1. Import our new DB connection function
const { initCronJobs } = require('./services/notificationService');

// Load environment variables
dotenv.config();

// 2. Connect to the database
connectDB();

// 3. Initialize background notification jobs
initCronJobs();

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    // Set static folder (Assuming frontend is deployed alongside backend in a monorepo structure)
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Any route that is not an API route will hit this and load the React app
    app.use((req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    });
} else {
    // A simple test route for development
    app.get('/', (req, res) => {
        res.send('Task Management API is running! (Development Mode)');
    });
}

// Define the port 
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});