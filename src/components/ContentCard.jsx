// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { FileText, Brain, HelpCircle, Mic } from 'lucide-react';
// @ts-ignore;
import { cn } from '@/lib/utils';

export function ContentCard({
  type,
  title,
  preview,
  date,
  onClick
}) {
  const icons = {
    notes: FileText,
    flashcards: Brain,
    quiz: HelpCircle,
    podcast: Mic
  };
  const colors = {
    notes: 'text-blue-500',
    flashcards: 'text-green-500',
    quiz: 'text-purple-500',
    podcast: 'text-orange-500'
  };
  const Icon = icons[type] || FileText;
  return <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <Icon className={cn("w-6 h-6", colors[type])} />
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 capitalize">{type}</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>;
}