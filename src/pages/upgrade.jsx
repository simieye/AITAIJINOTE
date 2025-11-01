// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { ArrowLeft, Check, Crown, Star, Zap, Clock, Shield, Users, BookOpen, Brain, HelpCircle, CreditCard, CheckCircle, X } from 'lucide-react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function UpgradePage(props) {
  const {
    $w
  } = props;
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();

  // 订阅计划配置
  const plans = {
    free: {
      name: '免费版',
      price: 0,
      priceText: '免费',
      period: '永久',
      description: '适合初学者体验',
      features: ['每月10次录音转录', '基础笔记功能', '标准闪卡生成', '基础测验', '社区支持'],
      limitations: ['每日限制5次AI调用', '无高级功能', '无优先支持'],
      color: 'gray',
      popular: false
    },
    super: {
      name: '超级太极',
      price: 29,
      priceText: '¥29/月',
      period: '按月订阅',
      description: '解锁全部AI能力',
      features: ['无限录音转录', '高级AI笔记分析', '智能闪卡优化', '个性化测验', '优先技术支持', '高级主题', '无广告体验', '云同步备份'],
      limitations: [],
      color: 'black',
      popular: true
    }
  };

  // 页面加载时获取用户订阅状态
  useEffect(() => {
    fetchUserSubscription();
  }, []);

  // 获取用户订阅状态
  const fetchUserSubscription = async () => {
    try {
      setLoading(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能查看订阅信息",
          variant: "destructive"
        });
        return;
      }

      // 获取用户订阅信息
      const subscriptionResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_subscriptions',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              user_id: {
                $eq: currentUser.userId
              },
              status: {
                $in: ['active', 'trialing', 'past_due']
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (subscriptionResult.code === 0 && subscriptionResult.data) {
        setUserSubscription(subscriptionResult.data);
        setSelectedPlan(subscriptionResult.data.plan_type || 'free');
      } else {
        // 默认免费版
        setUserSubscription({
          plan_type: 'free',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    } catch (error) {
      console.error('获取订阅信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理支付
  const handlePayment = async planType => {
    try {
      setProcessing(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser) {
        toast({
          title: "请先登录",
          description: "需要登录才能升级",
          variant: "destructive"
        });
        return;
      }

      // 创建支付记录
      const paymentResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_payments',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            user_id: currentUser.userId,
            amount: plans[planType].price * 100,
            // 转换为分
            currency: 'CNY',
            status: 'pending',
            description: `升级到${plans[planType].name}`,
            payment_method: 'wechat_pay',
            created_at: new Date().toISOString()
          }
        }
      });
      if (paymentResult.code === 0 && paymentResult.data) {
        // 更新订阅状态
        const subscriptionResult = await $w.cloud.callDataSource({
          dataSourceName: 'taiji_subscriptions',
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
              plan_type: planType,
              status: 'active',
              price: plans[planType].price,
              currency: 'CNY',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              auto_renew: true,
              updated_at: new Date().toISOString()
            },
            create: {
              user_id: currentUser.userId,
              plan_type: planType,
              status: 'active',
              price: plans[planType].price,
              currency: 'CNY',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              auto_renew: true,
              created_at: new Date().toISOString()
            }
          }
        });
        if (subscriptionResult.code === 0) {
          // 更新支付状态
          await $w.cloud.callDataSource({
            dataSourceName: 'taiji_payments',
            methodName: 'wedaUpdateV2',
            params: {
              data: {
                status: 'succeeded',
                paid_at: new Date().toISOString()
              },
              filter: {
                where: {
                  _id: {
                    $eq: paymentResult.data.id
                  }
                }
              }
            }
          });
          setShowSuccess(true);
          setUserSubscription({
            plan_type: planType,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          toast({
            title: "升级成功",
            description: `恭喜您已升级到${plans[planType].name}！`,
            variant: "success"
          });
        }
      } else {
        throw new Error(paymentResult.message || '支付失败');
      }
    } catch (error) {
      toast({
        title: "支付失败",
        description: error.message || '支付过程中出现错误',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // 取消订阅
  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      const currentUser = $w.auth.currentUser;
      if (!currentUser || !userSubscription) return;

      // 更新订阅状态为取消
      const cancelResult = await $w.cloud.callDataSource({
        dataSourceName: 'taiji_subscriptions',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          filter: {
            where: {
              user_id: {
                $eq: currentUser.userId
              },
              status: {
                $in: ['active', 'trialing']
              }
            }
          }
        }
      });
      if (cancelResult.code === 0) {
        setUserSubscription({
          ...userSubscription,
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        });
        toast({
          title: "取消成功",
          description: "您的订阅已取消，当前周期结束后将降级为免费版",
          variant: "success"
        });

        // 刷新订阅状态
        fetchUserSubscription();
      }
    } catch (error) {
      toast({
        title: "取消失败",
        description: error.message || '无法取消订阅',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // 格式化日期
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 计算节省金额
  const calculateSavings = () => {
    const yearlyPrice = 29 * 12;
    const discountedPrice = 290;
    return yearlyPrice - discountedPrice;
  };

  // 获取订阅状态文本
  const getSubscriptionStatusText = () => {
    if (!userSubscription) return '免费版';
    switch (userSubscription.status) {
      case 'active':
        return `${plans[userSubscription.plan_type]?.name} (有效期至 ${formatDate(userSubscription.current_period_end)})`;
      case 'cancelled':
        return `已取消，${formatDate(userSubscription.current_period_end)}后降级`;
      case 'past_due':
        return '订阅过期，请续费';
      default:
        return '免费版';
    }
  };
  if (showSuccess) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">升级成功！</h2>
            <p className="text-gray-600 mb-6">
              恭喜您已成功升级到超级太极版，现在可以享受所有高级功能！
            </p>
            <button onClick={() => $w.utils.navigateTo({
            pageId: 'index'
          })} className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors">
              开始使用
            </button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => $w.utils.navigateBack()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-xl font-semibold">升级订阅</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              当前状态：{getSubscriptionStatusText()}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择您的学习计划
          </h1>
          <p className="text-xl text-gray-600">
            解锁AI学习的全部潜能，让知识掌握更高效
          </p>
        </div>

        {/* 订阅计划卡片 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => <div key={key} className={`relative bg-white rounded-2xl shadow-lg p-8 ${plan.popular ? 'ring-2 ring-black' : ''}`}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-black text-white px-4 py-1 rounded-full text-sm font-medium">
                    推荐
                  </span>
                </div>}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {plan.priceText}
                </div>
                <p className="text-gray-600">{plan.period}</p>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">包含功能</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => <li key={index} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>)}
                  </ul>
                </div>
                
                {plan.limitations.length > 0 && <div>
                    <h4 className="font-semibold text-gray-900 mb-3">限制</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => <li key={index} className="flex items-center text-sm text-gray-500">
                          <X className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                          {limitation}
                        </li>)}
                    </ul>
                  </div>}
              </div>
              
              <button onClick={() => {
            if (key === 'free' && userSubscription?.plan_type === 'super') {
              handleCancelSubscription();
            } else if (key === 'super' && userSubscription?.plan_type !== 'super') {
              handlePayment('super');
            }
          }} disabled={processing || key === 'free' && userSubscription?.plan_type !== 'super' || key === 'super' && userSubscription?.plan_type === 'super' && userSubscription?.status === 'active'} className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${selectedPlan === key ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {key === 'free' && userSubscription?.plan_type === 'super' ? '降级到免费版' : key === 'super' && userSubscription?.plan_type === 'super' && userSubscription?.status === 'active' ? '当前订阅' : key === 'super' ? '立即升级' : '当前计划'}
              </button>
            </div>)}
        </div>

        {/* 详细功能对比 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">功能详细对比</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">功能</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">免费版</th>
                  <th className="text-center py-4 px-4 font-semibold text-black">超级太极</th>
                </tr>
              </thead>
              <tbody>
                {[{
                feature: '录音转录次数',
                free: '每月10次',
                super: '无限次'
              }, {
                feature: 'AI笔记分析',
                free: '基础版',
                super: '高级AI分析'
              }, {
                feature: '闪卡生成',
                free: '标准模式',
                super: '智能优化'
              }, {
                feature: '测验难度',
                free: '基础',
                super: '个性化'
              }, {
                feature: '云存储空间',
                free: '1GB',
                super: '100GB'
              }, {
                feature: '优先支持',
                free: '社区支持',
                super: '24/7优先支持'
              }, {
                feature: '高级主题',
                free: '基础主题',
                super: '全部主题'
              }, {
                feature: '无广告体验',
                free: '有广告',
                super: '无广告'
              }].map((item, index) => <tr key={index} className="border-b">
                  <td className="py-4 px-4 text-gray-900">{item.feature}</td>
                  <td className="py-4 px-4 text-center text-gray-600">{item.free}</td>
                  <td className="py-4 px-4 text-center font-medium text-black">{item.super}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">常见问题</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">如何取消订阅？</h3>
              <p className="text-gray-600">您可以随时在设置页面取消订阅，当前周期结束后将自动降级为免费版。</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">支持哪些支付方式？</h3>
              <p className="text-gray-600">支持微信支付、支付宝、银行卡等多种支付方式。</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">数据安全有保障吗？</h3>
              <p className="text-gray-600">我们采用银行级加密技术，确保您的学习数据安全。</p>
            </div>
          </div>
        </div>
      </main>
    </div>;
}