// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Search, Filter, Grid, List, Mic, FileText, Clock } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function LibraryPage(props) {
  const {
    $w
  } = props;
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [notes, setNotes] = useState([]);
  const [recordings, setRecordings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    toast
  } = useToast();

  // 页面加载时获取用户笔记列表
  useEffect(() => {
    fetchUserNotes();
  }, []);

  // 获取用户笔记列表
  const fetchUserNotes = async () => {
    try {
      setLoading(true);

      // 获取当前用户信息
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能查看笔记",
          variant: "destructive"
        });
        return;
      }

      // 查询用户的所有笔记
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
          getCount: true
        }
      });
      if (notesResult.code === 0 && notesResult.data) {
        const notesData = notesResult.data.records || [];
        setNotes(notesData);

        // 获取关联的录音信息
        const recordingIds = [...new Set(notesData.map(note => note.source_recording_id).filter(Boolean))];
        if (recordingIds.length > 0) {
          const recordingsResult = await $w.cloud.callDataSource({
            dataSourceName: 'taiji_recordings',
            methodName: 'wedaGetRecordsV2',
            params: {
              filter: {
                where: {
                  _id: {
                    $in: recordingIds
                  }
                }
              },
              select: {
                $master: true
              }
            }
          });
          if (recordingsResult.code === 0 && recordingsResult.data) {
            const recordingsMap = {};
            recordingsResult.data.records.forEach(recording => {
              recordingsMap[recording._id] = recording;
            });
            setRecordings(recordingsMap);
          }
        }
      } else {
        throw new Error(notesResult.message || '获取笔记失败');
      }
    } catch (error) {
      console.error('获取笔记失败:', error);
      toast({
        title: "获取失败",
        description: error.message || '无法加载笔记列表',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  // 搜索和筛选
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 处理卡片点击
  const handleCardClick = note => {
    $w.utils.navigateTo({
      pageId: 'viewer',
      params: {
        type: 'notes',
        id: note._id
      }
    });
  };
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">内容库</h1>
          <p className="mt-2 text-gray-600">管理您的所有学习材料</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索笔记标题或内容..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex gap-2">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
              <option value="all">全部类型</option>
              <option value="notes">笔记</option>
            </select>
            
            <div className="flex border border-gray-300 rounded-lg">
              <button className={`p-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-600'}`} onClick={() => setViewMode('grid')}>
                <Grid className="w-5 h-5" />
              </button>
              <button className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600'}`} onClick={() => setViewMode('list')}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>}

        {/* 内容网格 */}
        {!loading && filteredNotes.length > 0 && <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredNotes.map(note => {
          const recording = recordings[note.source_recording_id];
          return <div key={note._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleCardClick(note)}>
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {note.title || '无标题笔记'}
                  </h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {note.content ? note.content.substring(0, 100) + '...' : '暂无内容'}
                  </p>
                  
                  {recording && <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Mic className="w-3 h-3 mr-1" />
                      <span>来自: {recording.title || '录音文件'}</span>
                    </div>}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {note.tags?.slice(0, 3).map((tag, index) => <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>)}
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>;
        })}
          </div>}

        {/* 空状态 */}
        {!loading && filteredNotes.length === 0 && <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '没有找到匹配的笔记' : '还没有笔记'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? '尝试调整搜索关键词' : '开始录音或上传文件来创建您的第一个笔记'}
            </p>
          </div>}
      </div>
    </div>;
}