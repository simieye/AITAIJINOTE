// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { ArrowLeft, User, Bell, Palette, Globe, Save, Check, Moon, Sun, Settings } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function SettingsPage(props) {
  const {
    $w
  } = props;
  const [userInfo, setUserInfo] = useState({
    display_name: '',
    language: 'zh-CN',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      study: true,
      marketing: false
    },
    timezone: 'Asia/Shanghai',
    font_size: 'medium',
    auto_save: true,
    tts_voice: 'zh-CN-XiaoxiaoNeural',
    tts_speed: 1.0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewTheme, setPreviewTheme] = useState('light');
  const {
    toast
  } = useToast();

  // 页面加载时获取用户偏好
  useEffect(() => {
    fetchUserPreferences();
  }, []);

  // 获取用户偏好设置
  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能查看设置",
          variant: "destructive"
        });
        return;
      }

      // 获取用户偏好设置
      const prefsResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_preferences',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: currentUser.userId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (prefsResult.code === 0 && prefsResult.data) {
        setUserInfo(prefsResult.data);
        setPreviewTheme(prefsResult.data.theme || 'light');
        // 应用主题
        document.documentElement.className = prefsResult.data.theme || 'light';
      } else {
        // 使用默认设置
        setUserInfo({
          display_name: currentUser.name || '用户',
          language: 'zh-CN',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            study: true,
            marketing: false
          },
          timezone: 'Asia/Shanghai',
          font_size: 'medium',
          auto_save: true,
          tts_voice: 'zh-CN-XiaoxiaoNeural',
          tts_speed: 1.0
        });
      }
    } catch (error) {
      console.error('获取用户设置失败:', error);
      toast({
        title: "获取失败",
        description: '无法加载用户设置',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const saveSettings = async () => {
    try {
      setSaving(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能保存设置",
          variant: "destructive"
        });
        return;
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_user_preferences',
        methodName: 'wedaUpsertV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: currentUser.userId
              }
            }
          },
          update: {
            ...userInfo,
            updated_at: new Date().toISOString()
          },
          create: {
            user_id: currentUser.userId,
            ...userInfo,
            created_at: new Date().toISOString()
          }
        }
      });
      if (result.code === 0) {
        toast({
          title: "保存成功",
          description: "设置已更新",
          variant: "success"
        });

        // 应用主题
        document.documentElement.className = userInfo.theme;
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: error.message || '无法保存设置',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理通知设置变化
  const handleNotificationChange = (type, value) => {
    setUserInfo(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }));
  };

  // 主题选项
  const themes = [{
    value: 'light',
    label: '浅色',
    icon: Sun,
    description: '明亮的界面'
  }, {
    value: 'dark',
    label: '深色',
    icon: Moon,
    description: '暗色界面'
  }, {
    value: 'taiji',
    label: '太极',
    icon: Settings,
    description: '黑白太极主题'
  }];

  // 语言选项
  const languages = [{
    value: 'zh-CN',
    label: '简体中文'
  }, {
    value: 'en-US',
    label: 'English'
  }, {
    value: 'ja-JP',
    label: '日本語'
  }];

  // 字体大小选项
  const fontSizes = [{
    value: 'small',
    label: '小'
  }, {
    value: 'medium',
    label: '中'
  }, {
    value: 'large',
    label: '大'
  }];

  // 时区选项
  const timezones = [{
    value: 'Asia/Shanghai',
    label: '中国标准时间 (UTC+8)'
  }, {
    value: 'America/New_York',
    label: '美国东部时间 (UTC-5)'
  }, {
    value: 'Europe/London',
    label: '英国时间 (UTC+0)'
  }];
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => $w.utils.navigateBack()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-xl font-semibold">设置</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 账户信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            账户信息
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                显示名称
              </label>
              <input type="text" value={userInfo.display_name} onChange={e => handleInputChange('display_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" placeholder="输入显示名称" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-black to-white rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {userInfo.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  更换头像
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 主题设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            主题设置
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map(theme => {
            const Icon = theme.icon;
            return <button key={theme.value} onClick={() => {
              handleInputChange('theme', theme.value);
              setPreviewTheme(theme.value);
            }} className={`p-4 rounded-lg border-2 transition-all ${userInfo.theme === theme.value ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-300'}`}>
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{theme.label}</div>
                <div className="text-xs opacity-75">{theme.description}</div>
              </button>;
          })}
          </div>
        </div>

        {/* 语言设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            语言设置
          </h2>
          
          <select value={userInfo.language} onChange={e => handleInputChange('language', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
            {languages.map(lang => <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>)}
          </select>
        </div>

        {/* 字体大小设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">字体大小</h2>
          <select value={userInfo.font_size} onChange={e => handleInputChange('font_size', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
            {fontSizes.map(size => <option key={size.value} value={size.value}>
                {size.label}
              </option>)}
          </select>
        </div>

        {/* 时区设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">时区设置</h2>
          <select value={userInfo.timezone} onChange={e => handleInputChange('timezone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
            {timezones.map(zone => <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>)}
          </select>
        </div>

        {/* TTS 设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">语音播报设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">默认语音</label>
              <select value={userInfo.tts_voice} onChange={e => handleInputChange('tts_voice', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                <option value="zh-CN-XiaoxiaoNeural">中文女声</option>
                <option value="zh-CN-YunjianNeural">中文男声</option>
                <option value="en-US-JennyNeural">英文女声</option>
                <option value="en-US-GuyNeural">英文男声</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">默认语速</label>
              <select value={userInfo.tts_speed} onChange={e => handleInputChange('tts_speed', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            通知设置
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">邮件通知</span>
              <input type="checkbox" checked={userInfo.notifications.email} onChange={e => handleNotificationChange('email', e.target.checked)} className="w-5 h-5 text-black rounded focus:ring-black" />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">推送通知</span>
              <input type="checkbox" checked={userInfo.notifications.push} onChange={e => handleNotificationChange('push', e.target.checked)} className="w-5 h-5 text-black rounded focus:ring-black" />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">学习提醒</span>
              <input type="checkbox" checked={userInfo.notifications.study} onChange={e => handleNotificationChange('study', e.target.checked)} className="w-5 h-5 text-black rounded focus:ring-black" />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">自动保存</span>
              <input type="checkbox" checked={userInfo.auto_save} onChange={e => handleInputChange('auto_save', e.target.checked)} className="w-5 h-5 text-black rounded focus:ring-black" />
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button onClick={saveSettings} disabled={saving} className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>保存中...</span>
              </> : <>
                <Save className="w-4 h-4" />
                <span>保存设置</span>
              </>}
          </button>
        </div>
      </main>
    </div>;
}