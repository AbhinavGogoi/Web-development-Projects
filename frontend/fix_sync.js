const fs = require('fs');

const files = ['src/pages/Dashboard.jsx', 'src/pages/GoalsPage.jsx', 'src/pages/CalendarPage.jsx', 'src/pages/SettingsPage.jsx'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Prevent sidebar squishing by adding min-w-0 to main
    content = content.replace(/<main className="([^"]*?flex-1[^"]*?)"/g, (match, classes) => {
        if (!classes.includes('min-w-0')) {
            return <main className=" min-w-0";
        }
        return match;
    });

    // 2. Add flex-shrink-0 to the Sidebar in Sidebar.jsx
    // (We'll do this in Sidebar.jsx separately)

    // 3. Sync all card stylings to frosted glass (bg-white dark:bg-white/10 dark:backdrop-blur-2xl)
    content = content.replace(/bg-white\/60 dark:bg-slate-800\/50 backdrop-blur-2xl/g, 'bg-white dark:bg-white/10 dark:backdrop-blur-2xl');
    content = content.replace(/bg-slate-50 dark:bg-slate-900/g, 'bg-white dark:bg-white/10');
    content = content.replace(/dark:border-slate-700\/50/g, 'dark:border-white/10');
    content = content.replace(/dark:border-slate-700/g, 'dark:border-white/10');
    content = content.replace(/bg-white dark:bg-slate-800/g, 'bg-white dark:bg-white/10 dark:backdrop-blur-2xl');
    
    // Specifically for GoalsPage
    content = content.replace(/bg-white dark:bg-white\/10 backdrop-blur-2xl/g, 'bg-white dark:bg-white/10 dark:backdrop-blur-2xl');

    fs.writeFileSync(file, content);
});

// Update Sidebar.jsx to prevent shrinking and fix badge colors
let sidebar = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
sidebar = sidebar.replace(/<aside className="([^"]*?w-64[^"]*?)"/, (match, classes) => {
    if (!classes.includes('flex-shrink-0')) {
        return <aside className=" flex-shrink-0";
    }
    return match;
});
// Ensure badge color works perfectly for all items, not just blue but a solid styling
sidebar = sidebar.replace(/bg-blue-100 dark:bg-blue-900\\/50 text-blue-700 dark:text-blue-300/g, 'bg-blue-500 text-white dark:bg-blue-500 dark:text-white shadow-sm');
sidebar = sidebar.replace(/bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300/g, 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400');
fs.writeFileSync('src/components/Sidebar.jsx', sidebar);

console.log('Fixed styling and layout!');
