export interface Message {
  text: string;
  sender: string;
  timestamp: string;
  isFromMe: boolean;
}

export interface MessageExport {
  messages: Message[];
}

export interface ContactCount {
  [contactName: string]: number;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export interface EmojiFrequency {
  emoji: string;
  count: number;
}

export interface LoveExpressions {
  love_you: number;
  love_emoji: number;
  miss_you: number;
  thinking_of_you: number;
  care_about_you: number;
}

export interface MessageAnalysis {
  // Basic stats
  totalMessages: number;
  mostActiveContact: string;
  averagePerDay: number;
  topWords: WordFrequency[];
  contactCounts: ContactCount;

  // Time-based patterns
  messagesByHour: Record<number, number>;
  messagesByWeekday: Record<string, number>;
  messagesByDate: Record<string, number>;
  mostActiveHour: string;
  mostActiveDay: string;

  // Sentiment analysis
  averageSentimentByContact: Record<string, number>;
  averageSentiment: number;

  // Response times
  averageResponseTimesByContact: Record<string, number>;

  // Message characteristics
  averageMessageLengthByContact: Record<string, number>;

  // Emoji analysis
  topEmojis: EmojiFrequency[];
  emojisByContact: Record<string, number>;
  totalEmojis: number;

  // Date range
  firstMessageDate: string;
  lastMessageDate: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
