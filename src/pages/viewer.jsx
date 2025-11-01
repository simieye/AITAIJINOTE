// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { ArrowLeft, Edit3, Share2, Download, Play, RefreshCw, Plus, Save, X, Brain, HelpCircle, Volume2, VolumeX, PlayCircle, PauseCircle, Square, Settings2, ChevronDown } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function ViewerPage(props) {
  const {
    $w
  } = props;
  const {
    type,
    id
  } = $w.page.dataset.params || {};
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);
  const {
    toast
  } = useToast();

  // 页面加载时获取数据
  useEffect(() => {
    if (id) {
      fetchNoteDetails();
      loadVoices();
    }
  }, [id]);

  // 加载语音列表
  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const filteredVoices = availableVoices.filter(voice => voice.lang.includes('zh') || voice.lang.includes('en'));
        setVoices(filteredVoices);

        // 默认选择中文女声
        const defaultVoice = filteredVoices.find(voice => voice.name.includes('Xiaoxiao') || voice.name.includes('Google 中文女声'));
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  };

  // 获取笔记详情及相关数据
  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能查看笔记",
          variant: "destructive"
        });
        return;
      }

      // 获取笔记详情
      const noteResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_notes',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: id
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (noteResult.code === 0 && noteResult.data) {
        const noteData = noteResult.data;
        setNote(noteData);
        setEditedContent(noteData.content || '');
        setEditedTitle(noteData.title || '');

        // 获取关联的闪卡
        const flashcardsResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_flashcards',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: {
              where: {
                note_id: {
                  $eq: id
                }
              }
            },
            select: {
              $master: true
            },
            orderBy: [{
              createdAt: 'asc'
            }]
          }
        });
        if (flashcardsResult.code === 0 && flashcardsResult.data) {
          setFlashcards(flashcardsResult.data.records || []);
        }

        // 获取关联的测验
        const quizzesResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_quizzes',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: {
              where: {
                note_id: {
                  $eq: id
                }
              }
            },
            select: {
              $master: true
            },
            orderBy: [{
              createdAt: 'asc'
            }]
          }
        });
        if (quizzesResult.code === 0 && quizzesResult.data) {
          setQuizzes(quizzesResult.data.records || []);
        }
      } else {
        throw new Error(noteResult.message || '获取笔记失败');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      toast({
        title: "获取失败",
        description: error.message || '无法加载笔记详情',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存笔记
  const saveNote = async () => {
    try {
      setSaving(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_notes',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            title: editedTitle,
            content: editedContent,
            updatedAt: new Date().toISOString()
          },
          filter: {
            where: {
              _id: {
                $eq: id
              }
            }
          }
        }
      });
      if (result.code === 0 && result.data) {
        setNote(prev => ({
          ...prev,
          title: editedTitle,
          content: editedContent
        }));
        setIsEditing(false);
        toast({
          title: "保存成功",
          description: "笔记已更新",
          variant: "success"
        });
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: error.message || '无法保存笔记',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // 生成闪卡
  const generateFlashcards = async () => {
    try {
      setGeneratingFlashcards(true);
      const result = await $w.cloud.callFunction({
        name: 'flashcard-generation',
        data: {
          noteId: id
        }
      });
      if (result.code === 0 && result.data) {
        setFlashcards(result.data.flashcards || []);
        toast({
          title: "生成成功",
          description: `已生成 ${result.data.flashcards?.length || 0} 张闪卡`,
          variant: "success"
        });
      } else {
        throw new Error(result.message || '生成失败');
      }
    } catch (error) {
      toast({
        title: "生成失败",
        description: error.message || '无法生成闪卡',
        variant: "destructive"
      });
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  // 生成测验
  const generateQuiz = async () => {
    try {
      setGeneratingQuiz(true);
      const result = await $w.cloud.callFunction({
        name: 'quiz-generation',
        data: {
          noteId: id
        }
      });
      if (result.code === 0 && result.data) {
        setQuizzes(result.data.questions || []);
        toast({
          title: "生成成功",
          description: `已生成 ${result.data.questions?.length || 0} 道测验题`,
          variant: "success"
        });
      } else {
        throw new Error(result.message || '生成失败');
      }
    } catch (error) {
      toast({
        title: "生成失败",
        description: error.message || '无法生成测验',
        variant: "destructive"
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditedContent(note?.content || '');
    setEditedTitle(note?.title || '');
    setIsEditing(false);
  };

  // 播放语音
  const playSpeech = () => {
    if (!note?.content) return;
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(note.content);
    utterance.voice = voices.find(voice => voice.name === selectedVoice) || null;
    utterance.rate = playbackRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setIsPlaying(true);
      setDuration(note.content.length / 15); // 估算时长
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    utterance.onerror = event => {
      console.error('语音播放错误:', event);
      setIsPlaying(false);
      toast({
        title: "播放失败",
        description: "语音播放出现错误，请重试",
        variant: "destructive"
      });
    };
    utterance.onboundary = event => {
      setCurrentTime(event.charIndex / note.content.length * duration);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // 暂停语音
  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  // 恢复播放
  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  // 停止语音
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 格式化时间
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度条拖动
  const handleProgressChange = e => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    // 由于 Web Speech API 不支持跳转，这里只是视觉反馈
  };

  // 播放速率选项
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>;
  }
  if (!note) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">笔记不存在</h2>
          <button onClick={() => $w.utils.navigateBack()} className="text-blue-600 hover:text-blue-800">
            返回
          </button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => $w.utils.navigateBack()} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-xl font-semibold">
                {isEditing ? <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="border-b-2 border-gray-300 focus:border-black outline-none px-2 py-1" placeholder="输入标题" /> : note.title || '无标题笔记'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowTTSControls(!showTTSControls)} className={`p-2 rounded-lg transition-colors ${showTTSControls ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                <Volume2 className="w-5 h-5" />
              </button>
              {isEditing ? <>
                  <button onClick={saveNote} disabled={saving} className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    <span>{saving ? '保存中...' : '保存'}</span>
                  </button>
                  <button onClick={cancelEdit} className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                    <X className="w-4 h-4" />
                    <span>取消</span>
                  </button>
                </> : <>
                  <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="w-5 h-5" />
                  </button>
                </>}
            </div>
          </div>
        </div>
      </header>

      {/* TTS 控制面板 */}
      {showTTSControls && <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">语音播报</h3>
              <button onClick={() => setShowTTSControls(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* 播放控制 */}
              <div className="flex items-center space-x-2">
                <button onClick={isPlaying ? pauseSpeech : playSpeech} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  {isPlaying ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                </button>
                <button onClick={stopSpeech} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  <Square className="w-5 h-5" />
                </button>
                <button onClick={resumeSpeech} disabled={!window.speechSynthesis?.paused} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">
                  <Play className="w-5 h-5" />
                </button>
              </div>
              
              {/* 语音选择 */}
              <div className="flex items-center space-x-2">
                <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {voices.map(voice => <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>)}
                </select>
              </div>
              
              {/* 语速调节 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">语速:</span>
                <select value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {playbackRates.map(rate => <option key={rate} value={rate}>
                      {rate}x
                    </option>)}
                </select>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input type="range" min="0" max={duration} value={currentTime} onChange={handleProgressChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>}

      {/* 内容区域 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 笔记内容 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="prose max-w-none">
            {isEditing ? <textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} className="w-full min-h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none" placeholder="输入笔记内容..." /> : <div className="whitespace-pre-wrap">
                {note.content || '暂无内容'}
              </div>}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>创建于: {new Date(note.createdAt).toLocaleString('zh-CN')}</span>
            {note.updatedAt !== note.createdAt && <span>更新于: {new Date(note.updatedAt).toLocaleString('zh-CN')}</span>}
          </div>
        </div>

        {/* 闪卡区域 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">闪卡 ({flashcards.length})</h2>
            <button onClick={generateFlashcards} disabled={generatingFlashcards} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${generatingFlashcards ? 'animate-spin' : ''}`} />
              <span>{generatingFlashcards ? '生成中...' : '重新生成'}</span>
            </button>
          </div>
          
          {flashcards.length > 0 ? <div className="space-y-4">
              {flashcards.map((card, index) => <div key={card._id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">问题 {index + 1}</h3>
                    <p className="mt-2 text-gray-700">{card.front}</p>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-900 mb-2">答案</h4>
                    <p className="text-gray-700">{card.back}</p>
                  </div>
                </div>)}
            </div> : <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无闪卡</h3>
              <p className="text-gray-600 mb-4">基于笔记内容生成学习闪卡</p>
              <button onClick={generateFlashcards} disabled={generatingFlashcards} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 mx-auto">
                <Plus className="w-4 h-4" />
                <span>生成闪卡</span>
              </button>
            </div>}
        </div>

        {/* 测验区域 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">测验 ({quizzes.length})</h2>
            <button onClick={generateQuiz} disabled={generatingQuiz} className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${generatingQuiz ? 'animate-spin' : ''}`} />
              <span>{generatingQuiz ? '生成中...' : '重新生成'}</span>
            </button>
          </div>
          
          {quizzes.length > 0 ? <div className="space-y-6">
              {quizzes.map((quiz, index) => <div key={quiz._id} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {index + 1}. {quiz.question}
                  </h3>
                  <div className="space-y-2">
                    {quiz.options.map((option, optIndex) => <label key={optIndex} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name={`q${index}`} className="mr-3" />
                        <span>{option}</span>
                      </label>)}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>解释：</strong>{quiz.explanation}
                    </p>
                  </div>
                </div>)}
            </div> : <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无测验</h3>
              <p className="text-gray-600 mb-4">基于笔记内容生成测验题</p>
              <button onClick={generateQuiz} disabled={generatingQuiz} className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 mx-auto">
                <Plus className="w-4 h-4" />
                <span>生成测验</span>
              </button>
            </div>}
        </div>
      </main>
    </div>;
}