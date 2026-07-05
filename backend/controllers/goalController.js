const Goal = require('../models/Goal');

// @desc    Retrieve all goals for the logged-in user
// @route   GET /api/goals
const getGoals = async (req, res) => {
    try {
        // Find all goals where the userId matches the logged-in user
        const goals = await Goal.find({ userId: req.user._id }).sort({ targetDate: 1 });

        res.status(200).json({ success: true, goals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a weekly goal
// @route   POST /api/goals
const createGoal = async (req, res) => {
    try {
        const { title, targetDate, linkedTasks, progress } = req.body;

        if (!title || !targetDate) {
            return res.status(400).json({ success: false, message: 'Please add a title and target date' });
        }

        const goal = await Goal.create({
            userId: req.user._id,
            title,
            targetDate,
            progress: progress || 0,
            linkedTasks: linkedTasks || [] // Defaults to an empty array if no tasks are linked yet
        });


        res.status(201).json({ success: true, goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a goal (e.g., changing status or adding linked tasks)
// @route   PUT /api/goals/:id
const updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this goal' });
        }

        const updatedGoal = await Goal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json({ success: true, goal: updatedGoal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this goal' });
        }

        await goal.deleteOne();

        res.status(200).json({ success: true, id: req.params.id, message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };