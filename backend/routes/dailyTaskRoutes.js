const express = require('express');
const router = express.Router();
const { getDailyTasks, createDailyTask, updateDailyTask, deleteDailyTask } = require('../controllers/dailyTaskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getDailyTasks)
    .post(protect, createDailyTask);

router.route('/:id')
    .put(protect, updateDailyTask)
    .delete(protect, deleteDailyTask);

module.exports = router;
