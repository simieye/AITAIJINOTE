// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Upload, FileText, Mic, Video } from 'lucide-react';
// @ts-ignore;
import { cn } from '@/lib/utils';

export function UploadZone({
  onFileUpload
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFileUpload(files);
  };
  const fileTypes = [{
    icon: FileText,
    label: 'PDF',
    color: 'text-blue-500'
  }, {
    icon: Mic,
    label: '音频',
    color: 'text-green-500'
  }, {
    icon: Video,
    label: '视频',
    color: 'text-purple-500'
  }];
  return <div className={cn("relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300", isDragging ? "border-black bg-gray-50 scale-105" : "border-gray-300 hover:border-gray-400")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="text-center">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">拖拽文件到此处</h3>
        <p className="text-sm text-gray-600 mb-4">或点击选择文件</p>
        
        <div className="flex justify-center gap-4 mb-4">
          {fileTypes.map(({
          icon: Icon,
          label,
          color
        }) => <div key={label} className="flex flex-col items-center">
              <Icon className={cn("w-8 h-8 mb-1", color)} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>)}
        </div>
        
        <button className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors" onClick={() => document.getElementById('file-input').click()}>
          选择文件
        </button>
        <input id="file-input" type="file" className="hidden" multiple accept=".pdf,.mp3,.mp4,.wav,.m4a" onChange={e => onFileUpload(Array.from(e.target.files))} />
      </div>
      
      {isDragging && <div className="absolute inset-0 bg-black bg-opacity-10 rounded-2xl flex items-center justify-center">
          <div className="text-white bg-black px-4 py-2 rounded-full">释放以上传</div>
        </div>}
    </div>;
}