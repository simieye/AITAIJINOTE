// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Bell, User, Settings, Search, Brain, HelpCircle, Mic, FileText, Plus, Play } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

import { TaijiSlider } from '@/components/TaijiSlider';
import { UploadZone } from '@/components/UploadZone';
import { ContentCard } from '@/components/ContentCard';
import { RecordingButton } from '@/components/RecordingButton';
export default function TaijiDashboard(props) {
  const {
    $w
  } = props;
  const [taijiMode, setTaijiMode] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentRecordings, setRecentRecordings] = useState([]);
  const {
    toast
  } = useToast();

  // 页面加载时获取数据
  useEffect(() => {
    fetchRecentContent();
  }, []);

  // 获取最近内容
  const fetchRecentContent = async () => {
    try {
      const currentUser = $w.auth.currentUser;
      if (!currentUser) return;

      // 获取最近笔记
      const notesResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_notes',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              owner: {
                $eq: currentUser.userId
              }
            }
          },
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 4,
          pageNumber: 1
        }
      });
      if (notesResult.code === 0 && notesResult.data) {
        setRecentNotes(notesResult.data.records || []);
      }

      // 获取最近录音
      const recordingsResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_recordings',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              owner: {
                $eq: currentUser.userId
              }
            }
          },
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 4,
          pageNumber: 1
        }
      });
      if (recordingsResult.code === 0 && recordingsResult.data) {
        setRecentRecordings(recordingsResult.data.records || []);
      }
    } catch (error) {
      console.error('获取内容失败:', error);
    }
  };

  // 处理文件上传
  const handleFileUpload = async files => {
    try {
      setIsProcessing(true);
      toast({
        title: "开始处理",
        description: `正在处理 ${files.length} 个文件...`
      });
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能上传文件",
          variant: "destructive"
        });
        return;
      }

      // 处理每个文件
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('owner', currentUser.userId);
        const result = await $w.cloud.callFunction({
          name: 'note-generation',
          data: formData
        });
        if (result.code === 0 && result.data) {
          toast({
            title: "处理完成",
            description: `${file.name} 已转换为笔记`,
            variant: "success"
          });
        } else {
          throw new Error(result.message || '处理失败');
        }
      }

      // 刷新内容
      await fetchRecentContent();
    } catch (error) {
      toast({
        title: "处理失败",
        description: error.message || '文件处理失败，请重试',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理录音完成
  const handleRecordingComplete = async audioBlob => {
    try {
      toast({
        title: "开始上传",
        description: "正在上传录音文件..."
      });
      setIsProcessing(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能上传录音",
          variant: "destructive"
        });
        return;
      }
      const formData = new FormData();
      formData.append('file', audioBlob, `recording_${Date.now()}.wav`);
      formData.append('title', `录音_${new Date().toLocaleString()}`);
      formData.append('owner', currentUser.userId);
      const result = await $w.cloud.callFunction({
        name: 'audio-transcription',
        data: formData
      });
      if (result.code === 0 && result.data) {
        const {
          recordingId,
          transcription,
          duration,
          noteId
        } = result.data;
        setRecordings(prev => [...prev, {
          id: recordingId,
          transcription,
          duration,
          date: new Date().toLocaleString()
        }]);
        toast({
          title: "转录完成",
          description: `录音已转录，时长 ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
          variant: "success"
        });

        // 刷新内容
        await fetchRecentContent();
      } else {
        throw new Error(result.message || '转录失败');
      }
    } catch (error) {
      toast({
        title: "处理失败",
        description: error.message || '录音上传或转录失败，请重试',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 格式化日期
  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 跳转到笔记详情
  const navigateToNote = noteId => {
    $w.utils.navigateTo({
      pageId: 'viewer',
      params: {
        type: 'notes',
        id: noteId
      }
    });
  };
  return <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-black to-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <span className="ml-3 text-xl font-bold">太极AI笔记</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600" onClick={() => $w.utils.navigateTo({
              pageId: 'library'
            })}>
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero区域 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            太极AI智能笔记
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            平衡学习，智能记录
          </p>
          
          {/* 录音按钮 */}
          <div className="mb-12">
            <RecordingButton onRecordingComplete={handleRecordingComplete} />
          </div>
        </div>

        {/* 太极平衡模式 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">太极平衡模式</h2>
          <TaijiSlider value={taijiMode} onChange={setTaijiMode} />
        </div>

        {/* 上传区域 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">上传学习内容</h2>
          <UploadZone onFileUpload={handleFileUpload} />
        </div>

        {/* 处理状态 */}
        {isProcessing && <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-blue-600">AI正在处理您的文件...</span>
            </div>
          </div>}

        {/* 最近笔记 */}
        {recentNotes.length > 0 && <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">最近笔记</h2>
              <button className="text-sm text-gray-600 hover:text-gray-900" onClick={() => $w.utils.navigateTo({
            pageId: 'library'
          })}>
                查看全部
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentNotes.map(note => <div key={note._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => navigateToNote(note._id)}>
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {note.title || '无标题笔记'}
                  </h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {note.content ? note.content.substring(0, 100) + '...' : '暂无内容'}
                  </p>
                </div>)}
            </div>
          </div>}

        {/* 最近录音 */}
        {recentRecordings.length > 0 && <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">最近录音</h2>
            </div>
            
            <div className="space-y-4">
              {recentRecordings.map(recording => <div key={recording._id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{recording.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        时长: {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <button className="p-2 text-blue-600 hover:text-blue-800" onClick={() => $w.utils.navigateTo({
                pageId: 'viewer',
                params: {
                  type: 'notes',
                  id: recording.note_id
                }
              })}>
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                </div>)}
            </div>
          </div>}

        {/* 快速操作 */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all" onClick={() => $w.utils.navigateTo({
          pageId: 'library'
        })}>
            <Brain className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <span className="text-sm font-medium">闪卡复习</span>
          </button>
          <button className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all" onClick={() => $w.utils.navigateTo({
          pageId: 'library'
        })}>
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <span className="text-sm font-medium">开始测验</span>
          </button>
          <button className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all">
            <Mic className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <span className="text-sm font-medium">AI播客</span>
          </button>
          <button className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all" onClick={() => $w.utils.navigateTo({
          pageId: 'library'
        })}>
            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <span className="text-sm font-medium">查看笔记</span>
          </button>
        </div>
      </main>
    </div>;
}