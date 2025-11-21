export enum Tone {
  PROFESSIONAL = 'Professional',
  WITTY = 'Witty',
  URGENT = 'Urgent',
  INSPIRATIONAL = 'Inspirational',
  EDUCATIONAL = 'Educational'
}

export enum PlatformId {
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram'
}

export interface SocialPost {
  platformId: PlatformId;
  platformName: string;
  content: string;
  imagePrompt: string;
  imageData?: string; // Base64 string
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  totalEngagement: number;
}

export interface HistoryItem extends SocialPost {
  id: string;
  timestamp: number;
  metrics: EngagementMetrics;
  tone: Tone;
}

export interface GenerationResult {
  posts: SocialPost[];
}

export interface GenerateRequest {
  topic: string;
  tone: Tone;
}