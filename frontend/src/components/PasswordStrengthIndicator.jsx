import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
    // Calculate strength score (0 to 4)
    let score = 0;
    if (!password) {
        return null;
    }

    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let strengthLabel = 'Weak';
    let colorClass = 'bg-red-500';
    let textClass = 'text-red-500';

    switch (score) {
        case 1:
            strengthLabel = 'Fair';
            colorClass = 'bg-orange-500';
            textClass = 'text-orange-500';
            break;
        case 2:
            strengthLabel = 'Good';
            colorClass = 'bg-amber-400';
            textClass = 'text-amber-500';
            break;
        case 3:
            strengthLabel = 'Strong';
            colorClass = 'bg-emerald-500';
            textClass = 'text-emerald-500';
            break;
        case 4:
            strengthLabel = 'Excellent';
            colorClass = 'bg-emerald-600';
            textClass = 'text-emerald-600';
            break;
        default:
            strengthLabel = 'Weak';
            colorClass = 'bg-red-500';
            textClass = 'text-red-500';
    }

    return (
        <div className="mt-3 w-full">
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Password Strength</span>
                <span className={textClass}>{strengthLabel}</span>
            </div>
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((level) => (
                    <div 
                        key={level} 
                        className={`flex-1 rounded-full transition-all duration-300 ${score >= level ? colorClass : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default PasswordStrengthIndicator;
