const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Goal = require('../models/Goal');

// Define the schema for the functions the AI can call
const functionDeclarations = [
    {
        name: "createTask",
        description: "Creates a new task in the user's to-do list.",
        parameters: {
            type: "OBJECT",
            properties: {
                title: { type: "STRING", description: "The title of the task." },
                description: { type: "STRING", description: "Optional details about the task." },
                dueDate: { type: "STRING", description: "Due date in YYYY-MM-DD format. Default to today if unspecified." },
                priority: { type: "STRING", description: "Priority level: 'Low', 'Medium', or 'High'." },
                tag: { type: "STRING", description: "Category tag: 'Design', 'Development', 'Marketing', 'Research', 'Bug Fix', 'Planning', 'Content', or 'Other'." }
            },
            required: ["title", "dueDate"]
        }
    },
    {
        name: "updateTaskStatus",
        description: "Updates the status of an existing task.",
        parameters: {
            type: "OBJECT",
            properties: {
                taskId: { type: "STRING", description: "The MongoDB ID of the task to update." },
                status: { type: "STRING", description: "New status: 'Pending', 'In Progress', or 'Completed'." }
            },
            required: ["taskId", "status"]
        }
    },
    {
        name: "getTasks",
        description: "Retrieves the list of the user's current tasks.",
        parameters: {
            type: "OBJECT",
            properties: {
                status: { type: "STRING", description: "Optional filter by status: 'Pending', 'In Progress', or 'Completed'." }
            }
        }
    },
    {
        name: "createGoal",
        description: "Creates a new overarching weekly or long-term goal for the user.",
        parameters: {
            type: "OBJECT",
            properties: {
                title: { type: "STRING", description: "The title of the goal." },
                targetDate: { type: "STRING", description: "Target completion date in YYYY-MM-DD format." }
            },
            required: ["title", "targetDate"]
        }
    },
    {
        name: "getGoals",
        description: "Retrieves the list of the user's current goals so you can find their IDs.",
        parameters: {
            type: "OBJECT",
            properties: {}
        }
    },
    {
        name: "updateGoalProgress",
        description: "Updates the progress percentage of an existing goal.",
        parameters: {
            type: "OBJECT",
            properties: {
                goalId: { type: "STRING", description: "The MongoDB ID of the goal to update." },
                progress: { type: "NUMBER", description: "The new progress percentage (0 to 100)." }
            },
            required: ["goalId", "progress"]
        }
    }
];

// Helper to execute the actual database operations
async function executeFunctionCall(functionName, args, userId) {
    console.log(`AI called function: ${functionName} with args:`, args);
    try {
        switch (functionName) {
            case 'createTask':
                const newTask = new Task({
                    userId,
                    title: args.title,
                    description: args.description || '',
                    dueDate: new Date(args.dueDate),
                    priority: args.priority || 'Medium',
                    tag: args.tag || 'Other',
                    isAICreated: true,
                    status: 'Pending'
                });
                await newTask.save();
                return { success: true, message: `Task '${args.title}' created successfully!`, task: newTask };

            case 'updateTaskStatus':
                const updatedTask = await Task.findOneAndUpdate(
                    { _id: args.taskId, userId },
                    { status: args.status },
                    { new: true }
                );
                if (!updatedTask) return { success: false, message: 'Task not found or access denied.' };
                return { success: true, message: `Task status updated to ${args.status}.`, task: updatedTask };

            case 'getTasks':
                const query = { userId };
                if (args.status) query.status = args.status;
                const tasks = await Task.find(query).select('title status dueDate priority tag _id');
                return { success: true, tasks };

            case 'createGoal':
                const newGoal = new Goal({
                    userId,
                    title: args.title,
                    targetDate: new Date(args.targetDate),
                    status: 'On Track',
                    progress: 0
                });
                await newGoal.save();
                return { success: true, message: `Goal '${args.title}' created successfully!`, goal: newGoal };

            case 'getGoals':
                const goals = await Goal.find({ userId }).select('title progress status targetDate _id');
                return { success: true, goals };

            case 'updateGoalProgress':
                // Validate progress is between 0 and 100
                const progressVal = Math.min(Math.max(Number(args.progress) || 0, 0), 100);
                
                // Auto-update status if completed
                const statusUpdate = progressVal === 100 ? 'Completed' : 'On Track';

                const updatedGoal = await Goal.findOneAndUpdate(
                    { _id: args.goalId, userId },
                    { progress: progressVal, status: statusUpdate },
                    { new: true }
                );
                
                if (!updatedGoal) return { success: false, message: 'Goal not found or access denied.' };
                return { success: true, message: `Goal progress updated to ${progressVal}%.`, goal: updatedGoal };

            default:
                return { success: false, message: `Function ${functionName} not recognized.` };
        }
    } catch (error) {
        console.error(`Error in function ${functionName}:`, error);
        return { success: false, error: error.message };
    }
}

// The main AI chat controller
const chatWithAI = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const userId = req.user._id;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({ 
                response: "Hi there! I am your AI assistant. Currently operating in mock mode because no API key is set.",
                isMock: true
            });
        }

        // Use an unambiguous date format like 'Thu Jul 02 2026' to prevent DD/MM vs MM/DD confusion
        const systemPrompt = `You are Taskify AI, a helpful productivity assistant. You can manage the user's tasks and goals. If a user asks you to create a task/goal, use your tools to do it. The current date is ${new Date().toDateString()}. ALWAYS provide due dates in strict YYYY-MM-DD format. 
CRITICAL UI INSTRUCTION: If you need the user to choose a goal or task from a list (e.g. to update progress or status), DO NOT list the raw IDs in text. Instead, output this EXACT tag in your response: 
For Goals: [INTERACTIVE_GOAL_LIST: {"goals": [{"id": "goal_id", "title": "goal_title"}]}] 
For Tasks: [INTERACTIVE_TASK_LIST: {"tasks": [{"id": "task_id", "title": "task_title"}]}] 
The frontend will parse this tag and render a beautiful interactive UI for the user. Reply clearly and concisely.`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Bind the tools and system instructions to the model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            tools: [{ functionDeclarations }],
            systemInstruction: systemPrompt
        });

        // Convert the frontend history format to the Gemini SDK format
        let formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Gemini requires the history to strictly alternate, starting with 'user'.
        while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }

        // Merge consecutive messages of the same role to enforce strict alternation
        const strictHistory = [];
        for (const msg of formattedHistory) {
            if (strictHistory.length === 0) {
                strictHistory.push(msg);
            } else {
                const lastMsg = strictHistory[strictHistory.length - 1];
                if (lastMsg.role === msg.role) {
                    lastMsg.parts[0].text += `\n\n${msg.parts[0].text}`;
                } else {
                    strictHistory.push(msg);
                }
            }
        }

        // Start the chat session
        const chat = model.startChat({ history: strictHistory });
        
        // 1. Send the current message to the AI
        let result = await chat.sendMessage(message);
        
        // 2. Check if the AI decided to call a function
        const calls = typeof result.response.functionCalls === 'function' 
            ? result.response.functionCalls() 
            : result.response.functionCalls;
        
        const functionCall = calls && calls[0];
        
        if (functionCall) {
            // The AI wants to call a tool
            const functionName = functionCall.name;
            const args = functionCall.args;
            
            // Execute our backend logic
            const functionResponse = await executeFunctionCall(functionName, args, userId);
            
            // Send the result BACK to the AI so it can formulate a natural response
            result = await chat.sendMessage([{
                functionResponse: {
                    name: functionName,
                    response: functionResponse
                }
            }]);
        }

        const responseText = result.response.text();
        res.status(200).json({ response: responseText });

    } catch (error) {
        console.error('Error in AI Controller:', error);
        res.status(500).json({ message: 'Failed to process AI request', error: error.message });
    }
};

module.exports = { chatWithAI };
