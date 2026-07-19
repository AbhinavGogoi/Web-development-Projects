# Task Management App - Project Documentation

This document provides a detailed overview of the entire Task Management application. It outlines the frontend components, backend structure, database models, and the available API endpoints.

## 1. Project Overview
The Task Management App is a full-stack web application designed to help users manage their tasks and goals effectively. It features a modern, responsive UI built with React (Vite) and Tailwind CSS, and a robust backend built with Node.js, Express, and MongoDB. It also integrates Google Generative AI for AI-powered chat assistance.

### Tech Stack
- **Frontend**: React 19, React Router DOM, Tailwind CSS, Framer Motion, Vite.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose).
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs.
- **AI Integration**: `@google/generative-ai`.
- **Other Tools**: Multer (file uploads), dotenv (environment variables), CORS.

---

## 2. Frontend Components & Pages
The frontend is structured into components (reusable UI elements) and pages (route-level views), all wrapped within an animated routing context using Framer Motion.

### Main Entry & Routing
- `App.jsx`: The root component. Handles theme application (light/dark/system mode) and routing (`<AnimatedRoutes>`).
- Routes defined:
  - `/` -> Landing Page (Hero, Features, Pricing, etc.)
  - `/login` -> Authentication
  - `/dashboard` -> Overview Dashboard
  - `/tasks` -> Kanban Task Board
  - `/goals` -> Weekly Goals
  - `/calendar` -> Calendar View
  - `/settings` -> User Settings
  - `/help` -> Help Center
  - `/chat` -> AI Chat Assistant

### Pages (`frontend/src/pages/`)
1. **Auth.jsx**: Handles user registration and login forms.
2. **Dashboard.jsx**: The main hub displaying quick stats, recent tasks, and progress overviews.
3. **TasksPage.jsx**: A Kanban-style or list-style interface to create, read, update, and delete tasks.
4. **GoalsPage.jsx**: Interface for managing user goals, tracking progress, and linking tasks.
5. **CalendarPage.jsx**: A calendar view mapping out tasks based on their `dueDate` or `targetDate`.
6. **SettingsPage.jsx**: Allows users to manage their preferences (theme, timezone, notifications) and upload a profile photo.
7. **HelpCenterPage.jsx**: A support/documentation hub for users.
8. **AIChatPage.jsx**: The chat interface connecting to the backend AI controller for conversational assistance.

### Reusable Components (`frontend/src/components/`)
- **Navbar.jsx**: Top navigation bar with branding, links, and user context.
- **HeroSection.jsx**: The main introduction section on the landing page.
- **Features.jsx**: Highlights the core functionalities of the app.
- **Pricing.jsx**: Displays subscription or usage tiers.
- **Testimonials.jsx**: Social proof and user reviews.
- **Footer.jsx**: Bottom navigation and legal links.
- **PaperPlaneBackground.jsx**: A decorative animated background component.
- **Sidebar.jsx**: The side navigation menu used inside the authenticated app layout (Dashboard, Tasks, Goals, etc.).

---

## 3. Backend Details & Models
The backend follows an MVC-like architecture with Models, Controllers, and Routes.

### Database Models (`backend/models/`)
1. **User Schema (`User.js`)**:
   - Fields: `name`, `email`, `password`, `dob`, `profession`, `isVerified`, `profilePhoto`.
   - Nested Objects: 
     - `preferences`: `theme`, `language`, `timezone`, `compactMode`.
     - `notifications`: `emailAlerts`, `pushNotifications`, `weeklyDigest`, `taskReminders`.
2. **Task Schema (`Task.js`)**:
   - Fields: `userId` (ref User), `title`, `description`, `dueDate`, `status` (Pending, In Progress, Completed), `priority` (Low, Medium, High), `tag`, `tags`, `isAICreated`.
3. **Goal Schema (`Goal.js`)**:
   - Fields: `userId` (ref User), `title`, `targetDate`, `progress` (0-100), `status` (On Track, At Risk, Completed), `linkedTasks` (Array of Task refs).

### Core Configurations
- `server.js`: Initializes Express, sets up CORS and static file serving (`/uploads`), connects to MongoDB via `config/db.js`, and maps API routes.

---

## 4. API & Functions

The backend exposes several RESTful endpoints, generally protected by a JWT authorization middleware (`protect`).

### Authentication (`/api/auth`) -> `authRoutes.js`
- **POST `/api/auth/register`**: 
  - *Function*: `registerUser` (authController).
  - *Action*: Hashes the password using bcrypt, creates a new User document, and returns a JWT token.
- **POST `/api/auth/login`**: 
  - *Function*: `loginUser` (authController).
  - *Action*: Validates credentials and returns a JWT token.

### Tasks (`/api/tasks`) -> `taskRoutes.js`
- **GET `/api/tasks`**: 
  - *Function*: `getTasks` (taskController).
  - *Action*: Retrieves all tasks belonging to the authenticated user.
- **POST `/api/tasks`**: 
  - *Function*: `createTask` (taskController).
  - *Action*: Creates a new task.
- **PUT `/api/tasks/:id`**: 
  - *Function*: `updateTask` (taskController).
  - *Action*: Updates an existing task by ID.
- **DELETE `/api/tasks/:id`**: 
  - *Function*: `deleteTask` (taskController).
  - *Action*: Deletes a task by ID.

### Goals (`/api/goals`) -> `goalRoutes.js`
- **GET `/api/goals`**: 
  - *Function*: `getGoals` (goalController).
  - *Action*: Retrieves all goals for the user.
- **POST `/api/goals`**: 
  - *Function*: `createGoal` (goalController).
  - *Action*: Creates a new goal.
- **PUT `/api/goals/:id`**: 
  - *Function*: `updateGoal` (goalController).
  - *Action*: Updates a specific goal (e.g., updating progress).
- **DELETE `/api/goals/:id`**: 
  - *Function*: `deleteGoal` (goalController).
  - *Action*: Removes a goal by ID.

### Users & Settings (`/api/users`) -> `userRoutes.js`
- **GET `/api/users/settings`**: 
  - *Function*: `getSettings` (userController).
  - *Action*: Retrieves the user profile and preferences.
- **PUT `/api/users/settings`**: 
  - *Function*: `updateSettings` (userController).
  - *Action*: Updates user details, preferences, and notification settings.
- **POST `/api/users/photo`**: 
  - *Function*: `uploadPhoto` (userController).
  - *Action*: Accepts a `multipart/form-data` request with a `profilePhoto` field. Uses Multer to save the image to `/uploads` and updates the User's `profilePhoto` field.

### AI Assistant (`/api/ai`) -> `aiRoutes.js`
- **POST `/api/ai/chat`**: 
  - *Function*: `chatWithAI` (aiController).
  - *Action*: Receives user prompt, queries Google Generative AI (Gemini), and returns the generated response.

---
*End of Report*
