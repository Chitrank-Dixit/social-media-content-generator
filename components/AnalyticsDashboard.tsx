import React, { useEffect, useState } from 'react';
import { HistoryItem, PlatformId } from '../types';
import { generateAnalyticsInsights } from '../services/geminiService';

interface AnalyticsDashboardProps {
  history: HistoryItem[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Calculate aggregate stats
  const totalPosts = history.length;
  const totalLikes = history.reduce((sum, item) => sum + item.metrics.likes, 0);
  const totalShares = history.reduce((sum, item) => sum + item.metrics.shares, 0);
  const totalComments = history.reduce((sum, item) => sum + item.metrics.comments, 0);
  const avgEngagement = totalPosts > 0 ? Math.round((totalLikes + totalShares + totalComments) / totalPosts) : 0;

  // Calculate platform breakdown
  const platformStats = Object.values(PlatformId).map(pid => {
    const platformPosts = history.filter(h => h.platformId === pid);
    const engagement = platformPosts.reduce((sum, item) => sum + item.metrics.totalEngagement, 0);
    return {
      id: pid,
      count: platformPosts.length,
      engagement,
      avg: platformPosts.length > 0 ? Math.round(engagement / platformPosts.length) : 0
    };
  });

  const maxEngagement = Math.max(...platformStats.map(p => p.engagement), 1);

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const html = await generateAnalyticsInsights(history);
      setInsights(html);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400 uppercase font-semibold">Total Posts</p>
          <p className="text-3xl font-bold text-white mt-2">{totalPosts}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400 uppercase font-semibold">Total Likes</p>
          <p className="text-3xl font-bold text-pink-500 mt-2">{totalLikes.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400 uppercase font-semibold">Total Shares</p>
          <p className="text-3xl font-bold text-sky-500 mt-2">{totalShares.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <p className="text-sm text-slate-400 uppercase font-semibold">Avg. Engagement</p>
           <p className="text-3xl font-bold text-green-400 mt-2">{avgEngagement.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-800 p-8 rounded-xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">Performance by Platform</h3>
          <div className="space-y-6">
            {platformStats.map(stat => (
              <div key={stat.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-slate-300 font-medium">{stat.id}</span>
                  <span className="text-slate-400">{stat.engagement.toLocaleString()} engagements</span>
                </div>
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      stat.id === PlatformId.LINKEDIN ? 'bg-blue-500' :
                      stat.id === PlatformId.TWITTER ? 'bg-slate-400' : 'bg-pink-500'
                    }`}
                    style={{ width: `${(stat.engagement / maxEngagement) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Recent Activity</h4>
            <div className="space-y-3">
               {history.slice(0, 3).map(item => (
                 <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.platformId === PlatformId.LINKEDIN ? 'bg-blue-500' :
                            item.platformId === PlatformId.TWITTER ? 'bg-slate-400' : 'bg-pink-500'
                        }`} />
                        <p className="text-sm text-slate-300 truncate">{item.content}</p>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap ml-4">
                        {item.metrics.totalEngagement} eng.
                    </div>
                 </div>
               ))}
               {history.length === 0 && <p className="text-sm text-slate-500">No recent posts.</p>}
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-1 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="p-7 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">AI Analyst</h3>
            </div>

            <div className="flex-grow">
                {insights ? (
                    <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: insights }} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
                        <p className="text-slate-400 text-sm">
                            Ready to analyze {totalPosts} data points to find your best performing content strategies.
                        </p>
                        <button
                            onClick={handleGenerateInsights}
                            disabled={isLoadingInsights || totalPosts === 0}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium text-sm transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingInsights ? (
                                <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Analyzing...</span>
                                </>
                            ) : (
                                <span>Generate Insights</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
            {insights && (
                <button 
                    onClick={() => setInsights(null)}
                    className="mt-6 text-xs text-slate-500 hover:text-slate-400 underline"
                >
                    Refresh Analysis
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;