const express = require('express');
const router = express.Router();
// Import all 4 CRUD functions
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/tasks
router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

// Routes for /api/tasks/:id (Notice we expect an ID in the URL here)
router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;