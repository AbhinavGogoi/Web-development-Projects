const Task = require('../models/Task');

// @desc    Retrieve all tasks for the logged-in user
// @route   GET /api/tasks
const getTasks = async (req, res) => {
    try {
        // Find all tasks where the userId matches the logged-in user
        const tasks = await Task.find({ userId: req.user._id }).sort({ dueDate: 1 });

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, tag, tags } = req.body;

        // Basic validation
        if (!title || !dueDate) {
            return res.status(400).json({ success: false, message: 'Please add a title and due date' });
        }

        // Create the task linked to the user
        const task = await Task.create({
            userId: req.user._id, // Secured via our protect middleware!
            title,
            description,
            dueDate,
            priority,
            tag,
            tags
        });

        res.status(201).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Update task (e.g., changing status to 'Completed' via drag & drop)
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        // 1. Check if task exists
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // 2. Ensure the logged-in user matches the task's creator
        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this task' });
        }

        // 3. Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // This option returns the updated document rather than the old one
        );

        res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        // 1. Check if task exists
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // 2. Ensure the logged-in user matches the task's creator
        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this task' });
        }

        // 3. Delete the task
        await task.deleteOne();

        res.status(200).json({ success: true, id: req.params.id, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };