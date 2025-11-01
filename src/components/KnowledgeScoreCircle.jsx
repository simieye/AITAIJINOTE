// @ts-ignore;
import React from 'react';

export function KnowledgeScoreCircle({
  score
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - score / 100 * circumference;
  return <div className="relative w-48 h-48">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle cx="96" cy="96" r={radius} stroke="#e5e5e5" strokeWidth="12" fill="none" />
        <circle cx="96" cy="96" r={radius} stroke="#000000" strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-900">{score}</div>
        <div className="text-sm text-gray-600">知识气</div>
      </div>
    </div>;
}