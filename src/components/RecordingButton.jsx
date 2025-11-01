// @ts-ignore;
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Mic, Square, Play, Pause } from 'lucide-react';
// @ts-ignore;
import { cn } from '@/lib/utils';

export function RecordingButton({
  onRecordingComplete
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState([]);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        // 模拟波形数据
        setWaveform(prev => [...prev.slice(-30), Math.random() * 100]);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRecording, isPaused]);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: 'audio/wav'
        });
        onRecordingComplete(blob);
        chunksRef.current = [];
      };
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setWaveform([]);
    } catch (error) {
      console.error('录音权限被拒绝:', error);
    }
  };
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setWaveform([]);
    }
  };
  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return <div className="relative">
      {/* 录音状态指示器 */}
      {isRecording && <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm">
          {isPaused ? '录音已暂停' : '正在录音...'}
        </div>}

      {/* 波形显示 */}
      {isRecording && <div className="mb-4 h-16 flex items-end justify-center space-x-1">
          {waveform.map((height, index) => <div key={index} className="w-1 bg-gradient-to-t from-black to-gray-400 rounded-full transition-all duration-100" style={{
        height: `${Math.max(4, height)}px`
      }} />)}
        </div>}

      {/* 录音控制按钮 */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? <button onClick={startRecording} className="group relative w-20 h-20 bg-gradient-to-br from-black to-gray-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <Mic className="w-8 h-8 text-white" />
            <div className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button> : <>
            {/* 暂停/继续按钮 */}
            <button onClick={pauseRecording} className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              {isPaused ? <Play className="w-5 h-5 text-gray-700 ml-0.5" /> : <Pause className="w-5 h-5 text-gray-700" />}
            </button>

            {/* 录音时间 */}
            <div className="text-2xl font-mono text-gray-900">
              {formatDuration(duration)}
            </div>

            {/* 停止按钮 */}
            <button onClick={stopRecording} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
              <Square className="w-5 h-5 text-white" />
            </button>
          </>}
      </div>

      {/* 提示文字 */}
      <div className="mt-4 text-center">
        {!isRecording ? <p className="text-sm text-gray-600">点击开始录音</p> : <p className="text-sm text-gray-600">
            {isPaused ? '点击继续录音' : '点击暂停，或点击方块结束录音'}
          </p>}
      </div>
    </div>;
}