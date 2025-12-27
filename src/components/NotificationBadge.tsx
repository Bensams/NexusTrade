import React from 'react';

interface NotificationBadgeProps {
    count: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
    if (count <= 0) return null;

    return (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count > 9 ? "9+" : count}
        </span>
    );
};
