const DailyTask = require('../models/DailyTask');

// Get all daily tasks for the logged in user created TODAY
const getDailyTasks = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        const tasks = await DailyTask.find({
            userId: req.user._id,
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({ createdAt: 1 });

        res.json(tasks);
    } catch (error) {
        console.error('Get daily tasks error:', error);
        res.status(500).json({ message: 'Server error fetching daily tasks' });
    }
};

// Create a new daily task
const createDailyTask = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Task text is required' });
        }

        const newTask = new DailyTask({
            userId: req.user._id,
            text
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        console.error('Create daily task error:', error);
        res.status(500).json({ message: 'Server error creating daily task' });
    }
};

// Update a daily task (e.g. toggle completion)
const updateDailyTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed, text } = req.body;

        const task = await DailyTask.findOne({ _id: id, userId: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Daily task not found' });
        }

        if (completed !== undefined) task.completed = completed;
        if (text !== undefined) task.text = text;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        console.error('Update daily task error:', error);
        res.status(500).json({ message: 'Server error updating daily task' });
    }
};

// Delete a daily task
const deleteDailyTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await DailyTask.findOneAndDelete({ _id: id, userId: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Daily task not found' });
        }

        res.json({ message: 'Daily task removed' });
    } catch (error) {
        console.error('Delete daily task error:', error);
        res.status(500).json({ message: 'Server error deleting daily task' });
    }
};

module.exports = {
    getDailyTasks,
    createDailyTask,
    updateDailyTask,
    deleteDailyTask
};
