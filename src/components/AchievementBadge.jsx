// @ts-ignore;
import React from 'react';

export function AchievementBadge({
  achievement
}) {
  const Icon = achievement.icon;
  return <div className={`p-4 rounded-lg text-center transition-all ${achievement.unlocked ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
      <Icon className="w-8 h-8 mx-auto mb-2" />
      <div className="text-sm font-semibold">{achievement.name}</div>
      <div className="text-xs mt-1">{achievement.description}</div>
    </div>;
}