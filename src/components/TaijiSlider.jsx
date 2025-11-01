// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { cn } from '@/lib/utils';

export function TaijiSlider({
  value,
  onChange
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const handleChange = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, x / rect.width * 100));
    onChange(percentage);
  };
  return <div className="relative w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">阴 - 简洁</span>
        <span className="text-sm font-medium text-gray-600">阳 - 详细</span>
      </div>
      <div className="relative h-2 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 rounded-full cursor-pointer" onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} onMouseMove={isDragging ? handleChange : undefined} onClick={handleChange}>
        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-white to-black rounded-full transition-all duration-300" style={{
        width: `${value}%`
      }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-black rounded-full shadow-lg transition-all duration-300" style={{
        left: `calc(${value}% - 12px)`
      }}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-gray-300 to-black" />
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">
          {value < 33 ? '简洁模式 - 快速浏览' : value < 66 ? '平衡模式 - 适中深度' : '详细模式 - 深度解析'}
        </span>
      </div>
    </div>;
}