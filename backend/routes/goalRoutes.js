const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

// Routes for /api/goals
router.route('/')
    .get(protect, getGoals)
    .post(protect, createGoal);

// Routes for /api/goals/:id
router.route('/:id')
    .put(protect, updateGoal)
    .delete(protect, deleteGoal);

module.exports = router;