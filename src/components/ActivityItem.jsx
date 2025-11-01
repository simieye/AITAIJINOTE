// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { BookOpen, Brain, Target, Star } from 'lucide-react';

export function ActivityItem({
  activity
}) {
  const getActivityIcon = type => {
    switch (type) {
      case 'note_created':
        return BookOpen;
      case 'flashcard_reviewed':
        return Brain;
      case 'quiz_completed':
        return Target;
      default:
        return Star;
    }
  };
  const Icon = getActivityIcon(activity.activity_type);
  return <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
        <p className="text-xs text-gray-500">{new Date(activity.createdAt || activity.activity_date).toLocaleString('zh-CN')}</p>
      </div>
    </div>;
}