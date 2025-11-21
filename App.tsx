import React, { useState, useEffect } from 'react';
import { Tone, SocialPost, HistoryItem, PlatformId } from './types';
import { generateSocialText, generatePlatformImage } from './services/geminiService';
import PlatformCard from './components/PlatformCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';

// Helper to generate random simulated metrics based on platform/tone affinity
const simulateMetrics = (platform: PlatformId, tone: Tone): { likes: number, shares: number, comments: number } => {
  let baseEngagement = Math.floor(Math.random() * 500) + 100;
  
  // Boost based on "good fit" combinations
  if (platform === PlatformId.LINKEDIN && tone === Tone.PROFESSIONAL) baseEngagement *= 1.5;
  if (platform === PlatformId.TWITTER && tone === Tone.WITTY) baseEngagement *= 1.8;
  if (platform === PlatformId.INSTAGRAM && tone === Tone.INSPIRATIONAL) baseEngagement *= 1.6;

  return {
    likes: Math.floor(baseEngagement * 0.7),
    shares: Math.floor(baseEngagement * 0.2),
    comments: Math.floor(baseEngagement * 0.1),
  };
};

const generateMockHistory = (): HistoryItem[] => {
  const dummyTopics = [
    "Remote Work Trends", "AI in Healthcare", "Sustainable Coffee", "Morning Routine", "Tech Layoffs"
  ];
  
  const mockItems: HistoryItem[] = [];
  
  for(let i=0; i < 15; i++) {
    const platform = [PlatformId.LINKEDIN, PlatformId.TWITTER, PlatformId.INSTAGRAM][i % 3];
    const tone = Object.values(Tone)[i % 5];
    const metrics = simulateMetrics(platform, tone);
    
    mockItems.push({
      id: `mock-${i}`,
      platformId: platform,
      platformName: platform === PlatformId.LINKEDIN ? 'LinkedIn' : platform === PlatformId.TWITTER ? 'Twitter / X' : 'Instagram',
      content: `Simulated content about ${dummyTopics[i % 5]} with a ${tone} tone. This is a placeholder text for analytics visualization purposes.`,
      imagePrompt: "Abstract geometric shapes in blue and orange",
      aspectRatio: '1:1',
      timestamp: Date.now() - (i * 86400000), // Days ago
      tone: tone,
      metrics: {
        ...metrics,
        totalEngagement: metrics.likes + metrics.shares + metrics.comments
      }
    });
  }
  return mockItems;
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'generator' | 'analytics'>('generator');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with some mock data
  useEffect(() => {
    setHistory(generateMockHistory());
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGeneratingText(true);
    setError(null);
    setPosts([]);

    try {
      // 1. Generate Text Content for all platforms
      const generatedPosts = await generateSocialText(topic, tone);
      
      // Attach the Tone to the post object locally (not in type but helpful for saving later if we extended SocialPost, 
      // but we can just use the current 'tone' state when saving)
      setPosts(generatedPosts);
      setIsGeneratingText(false);

      // 2. Start Image Generation in parallel
      setIsGeneratingImages(true);
      
      const imagePromises = generatedPosts.map(async (post) => {
        const base64Image = await generatePlatformImage(post.imagePrompt, post.aspectRatio);
        
        setPosts(currentPosts => {
          const newPosts = [...currentPosts];
          const targetIndex = newPosts.findIndex(p => p.platformId === post.platformId);
          if (targetIndex !== -1) {
             newPosts[targetIndex] = { ...newPosts[targetIndex], imageData: base64Image };
          }
          return newPosts;
        });
      });

      await Promise.allSettled(imagePromises);

    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while contacting Gemini. Please check your API Key and try again.");
    } finally {
      setIsGeneratingText(false);
      setIsGeneratingImages(false);
    }
  };

  const handleRegenerateImage = (post: SocialPost) => {
    console.log("Regenerate requested for", post.platformId);
  };

  const handleSchedule = (post: SocialPost) => {
    const metrics = simulateMetrics(post.platformId, tone);
    const historyItem: HistoryItem = {
      ...post,
      id: `generated-${Date.now()}-${post.platformId}`,
      timestamp: Date.now(),
      tone: tone,
      metrics: {
        ...metrics,
        totalEngagement: metrics.likes + metrics.shares + metrics.comments
      }
    };
    setHistory(prev => [historyItem, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500/30">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('generator')}>
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SocialSync AI
            </h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
             <button 
                onClick={() => setCurrentView('generator')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    currentView === 'generator' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
             >
                Generator
             </button>
             <button 
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    currentView === 'analytics' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
             >
                Analytics
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {currentView === 'generator' ? (
          <>
            {/* Hero & Input Section */}
            <div className="max-w-3xl mx-auto mb-16 space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                  One Idea. <span className="text-sky-500">Every Platform.</span>
                </h2>
                <p className="text-lg text-slate-400">
                  Generate tailored content and perfectly sized visuals for LinkedIn, X, and Instagram in seconds.
                </p>
              </div>

              <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl shadow-black/50 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-300">
                    What do you want to post about?
                  </label>
                  <textarea
                    id="topic"
                    rows={3}
                    className="block w-full rounded-xl bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-4 shadow-inner resize-none"
                    placeholder="e.g., The future of remote work, launching a new coffee brand, simple react hooks tutorial..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="tone" className="block text-sm font-medium text-slate-300">
                      Select Tone
                    </label>
                    <div className="relative">
                        <select
                        id="tone"
                        className="block w-full rounded-xl bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-3 appearance-none"
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                        >
                        {Object.values(Tone).map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerate}
                      disabled={isGeneratingText || !topic}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 ${
                        (isGeneratingText || !topic) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-sky-500/25 transform hover:-translate-y-0.5'
                      }`}
                    >
                      {isGeneratingText ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Drafting Content...
                        </>
                      ) : (
                        'Generate Content'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center space-x-3 text-red-300">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Results Grid */}
            {posts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    {posts.map((post) => (
                    <PlatformCard 
                        key={post.platformId} 
                        post={post} 
                        onRegenerateImage={handleRegenerateImage}
                        onSchedule={handleSchedule}
                        isRegenerating={isGeneratingImages && !post.imageData}
                    />
                    ))}
                </div>
            )}

            {/* Empty State / Welcome Animation */}
            {!isGeneratingText && posts.length === 0 && !error && (
                <div className="text-center mt-20 opacity-30">
                     <svg className="w-24 h-24 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                     <p className="text-slate-500 font-light">Enter a topic above to start creating.</p>
                </div>
            )}
          </>
        ) : (
          <AnalyticsDashboard history={history} />
        )}
      </main>
    </div>
  );
};

export default App;