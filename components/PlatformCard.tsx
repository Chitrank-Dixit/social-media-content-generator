import React from 'react';
import { SocialPost, PlatformId } from '../types';

interface PlatformCardProps {
  post: SocialPost;
  onRegenerateImage: (post: SocialPost) => void;
  onSchedule: (post: SocialPost) => void;
  isRegenerating: boolean;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ post, onRegenerateImage, onSchedule, isRegenerating }) => {
  const [copied, setCopied] = React.useState(false);
  const [isScheduled, setIsScheduled] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!post.imageData) return;
    const link = document.createElement('a');
    link.href = post.imageData;
    link.download = `${post.platformId}_image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScheduleClick = () => {
    onSchedule(post);
    setIsScheduled(true);
  };

  const getIconColor = () => {
    switch (post.platformId) {
      case PlatformId.LINKEDIN: return 'text-blue-400';
      case PlatformId.TWITTER: return 'text-slate-200';
      case PlatformId.INSTAGRAM: return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 h-full`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50`}>
        <div className="flex items-center space-x-2">
           <div className={`w-3 h-3 rounded-full ${getIconColor().replace('text-', 'bg-')}`}></div>
           <h3 className={`font-bold text-lg ${getIconColor()}`}>{post.platformName}</h3>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
          AR: {post.aspectRatio}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-grow flex flex-col space-y-6">
        
        {/* Text Content */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Draft</label>
             <button 
                onClick={handleCopy}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
             >
               {copied ? 'Copied!' : 'Copy Text'}
             </button>
          </div>
          <textarea 
            readOnly
            className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none leading-relaxed custom-scrollbar"
            value={post.content}
          />
        </div>

        {/* Image Content */}
        <div className="space-y-2">
           <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generated Visual</label>
           <div className={`relative w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center group`}>
             {post.imageData ? (
               <img 
                src={post.imageData} 
                alt={`Generated visual for ${post.platformName}`}
                className="w-full h-auto object-contain max-h-[400px]"
               />
             ) : (
               <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 space-y-3 p-8 text-center">
                 {isRegenerating ? (
                   <>
                     <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span className="text-sm">Creating artwork...</span>
                   </>
                 ) : (
                    <span className="text-sm">Image failed to load</span>
                 )}
               </div>
             )}

             {/* Image Actions Overlay */}
             {post.imageData && (
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                 <button 
                   onClick={handleDownload}
                   className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-sky-50 transition-colors shadow-lg flex items-center space-x-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   <span>Download</span>
                 </button>
               </div>
             )}
           </div>
           <p className="text-[10px] text-slate-500 truncate">Prompt: {post.imagePrompt}</p>
        </div>

        <button
          onClick={handleScheduleClick}
          disabled={isScheduled}
          className={`w-full mt-auto py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isScheduled
              ? 'bg-green-500/20 text-green-400 cursor-default'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {isScheduled ? 'Scheduled for Analytics' : 'Schedule Post'}
        </button>
      </div>
    </div>
  );
};

export default PlatformCard;