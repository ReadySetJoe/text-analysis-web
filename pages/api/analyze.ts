import type { NextApiRequest, NextApiResponse } from "next";
import {
  MessageExport,
  MessageAnalysis,
  ContactCount,
  WordFrequency,
} from "../../types/message";

interface AnalyzeRequest extends NextApiRequest {
  body: MessageExport;
}

interface ErrorResponse {
  message: string;
}

// Sentiment Analysis (simplified version without external libraries)
function analyzeSentiment(text: string): number {
  const positiveWords = new Set([
    "love",
    "great",
    "awesome",
    "amazing",
    "wonderful",
    "fantastic",
    "excellent",
    "good",
    "happy",
    "joy",
    "excited",
    "perfect",
    "beautiful",
    "nice",
    "best",
    "incredible",
    "outstanding",
    "brilliant",
    "marvelous",
    "superb",
    "fabulous",
    "terrific",
    "pleased",
    "delighted",
  ]);

  const negativeWords = new Set([
    "hate",
    "terrible",
    "awful",
    "horrible",
    "bad",
    "worst",
    "sad",
    "angry",
    "annoyed",
    "frustrated",
    "disappointed",
    "disgusting",
    "pathetic",
    "stupid",
    "boring",
    "ugly",
    "furious",
    "depressed",
    "miserable",
    "disgusted",
    "irritated",
    "upset",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });

  // Return a compound score similar to VADER (-1 to 1)
  const totalSentimentWords = positiveCount + negativeCount;
  if (totalSentimentWords === 0) return 0;

  return (
    (positiveCount - negativeCount) /
    Math.sqrt(totalSentimentWords + words.length)
  );
}

// Love expressions analysis
function analyzeLoveExpressions(text: string): Record<string, number> {
  const patterns = {
    love_you: /\b(?:i\s+love\s+you|love\s+you|love\s+u|luv\s+you|luv\s+u)\b/gi,
    love_emoji: /❤️|💕|💖|😘|💓|💗|💘|💝|💞|♥/g,
    miss_you: /\b(?:i\s+miss\s+you|miss\s+you|miss\s+u)\b/gi,
    thinking_of_you: /\bthinking\s+of\s+you\b/gi,
    care_about_you: /\b(?:i\s+care\s+about\s+you|care\s+about\s+you)\b/gi,
  };

  const results: Record<string, number> = {};

  Object.entries(patterns).forEach(([key, pattern]) => {
    const matches = text.match(pattern);
    results[key] = matches ? matches.length : 0;
  });

  return results;
}

// Extract emojis from text
function extractEmojis(text: string): string[] {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
}

// Calculate response times between messages
function calculateResponseTimes(
  messages: { timestamp: string; isFromMe: boolean; sender: string }[]
): {
  responder: string;
  initiator: string;
  responseTimeMinutes: number;
  timestamp: Date;
}[] {
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const responseTimes: {
    responder: string;
    initiator: string;
    responseTimeMinutes: number;
    timestamp: Date;
  }[] = [];
  let previousSender: string | null = null;
  let previousTime: Date | null = null;

  sortedMessages.forEach(msg => {
    const currentSender = msg.isFromMe ? "You" : msg.sender;
    const currentTime = new Date(msg.timestamp);

    if (previousSender && previousTime && currentSender !== previousSender) {
      const timeDiffMinutes =
        (currentTime.getTime() - previousTime.getTime()) / (1000 * 60);

      // Only consider reasonable response times (less than 24 hours)
      if (timeDiffMinutes < 24 * 60) {
        responseTimes.push({
          responder: currentSender,
          initiator: previousSender,
          responseTimeMinutes: timeDiffMinutes,
          timestamp: currentTime,
        });
      }
    }

    previousSender = currentSender;
    previousTime = currentTime;
  });

  return responseTimes;
}

export default function handler(
  req: AnalyzeRequest,
  res: NextApiResponse<MessageAnalysis | ErrorResponse>
): void {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    // Validate message structure
    const isValidMessage = (
      msg: unknown
    ): msg is import("../../types/message").Message => {
      return (
        typeof msg === "object" &&
        typeof (msg as { text: string })?.text === "string" &&
        typeof (msg as { sender: string })?.sender === "string" &&
        typeof (msg as { timestamp: string })?.timestamp === "string" &&
        typeof (msg as { isFromMe: boolean })?.isFromMe === "boolean"
      );
    };

    const validMessages = messages.filter(isValidMessage);

    if (validMessages.length === 0) {
      return res.status(400).json({ message: "No valid messages found" });
    }

    // Enhanced message processing
    const processedMessages = validMessages.map(msg => {
      const date = new Date(msg.timestamp);
      const sender = msg.isFromMe ? "You" : msg.sender;

      return {
        ...msg,
        sender,
        date: date.toISOString().split("T")[0],
        hour: date.getHours(),
        weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        messageLength: msg.text.length,
        sentiment: analyzeSentiment(msg.text),
        loveExpressions: analyzeLoveExpressions(msg.text),
        emojis: extractEmojis(msg.text),
        emojiCount: extractEmojis(msg.text).length,
      };
    });

    // Basic statistics
    const totalMessages = processedMessages.length;

    // Contact counts
    const contactCounts: ContactCount = {};
    processedMessages.forEach(msg => {
      contactCounts[msg.sender] = (contactCounts[msg.sender] || 0) + 1;
    });

    const mostActiveContact =
      Object.entries(contactCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    // Date range and average per day
    const dates = processedMessages.map(msg => new Date(msg.timestamp));
    let averagePerDay = 0;

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const daysDiff =
        Math.ceil(
          (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        ) || 1;
      averagePerDay = Math.round((totalMessages / daysDiff) * 10) / 10;
    }

    // Word frequency analysis
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "can",
      "may",
      "might",
      "must",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "their",
      "our",
      "this",
      "that",
      "these",
      "those",
      "am",
      "so",
      "if",
      "when",
      "where",
      "why",
      "how",
      "what",
      "who",
      "which",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "than",
      "too",
      "very",
      "just",
      "now",
    ]);

    processedMessages.forEach(msg => {
      const words = msg.text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    const topWords: WordFrequency[] = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Advanced analytics

    // Messages by time patterns
    const messagesByHour: Record<number, number> = {};
    const messagesByWeekday: Record<string, number> = {};
    const messagesByDate: Record<string, number> = {};

    processedMessages.forEach(msg => {
      messagesByHour[msg.hour] = (messagesByHour[msg.hour] || 0) + 1;
      messagesByWeekday[msg.weekday] =
        (messagesByWeekday[msg.weekday] || 0) + 1;
      messagesByDate[msg.date] = (messagesByDate[msg.date] || 0) + 1;
    });

    // Sentiment analysis
    const sentimentByContact: Record<string, number[]> = {};
    const sentimentByDate: Record<string, number[]> = {};

    processedMessages.forEach(msg => {
      if (!sentimentByContact[msg.sender]) sentimentByContact[msg.sender] = [];
      if (!sentimentByDate[msg.date]) sentimentByDate[msg.date] = [];

      sentimentByContact[msg.sender].push(msg.sentiment);
      sentimentByDate[msg.date].push(msg.sentiment);
    });

    const averageSentimentByContact: Record<string, number> = {};
    Object.entries(sentimentByContact).forEach(([contact, sentiments]) => {
      averageSentimentByContact[contact] =
        sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    });

    // Love expressions analysis
    const totalLoveExpressions: Record<string, number> = {
      love_you: 0,
      love_emoji: 0,
      miss_you: 0,
      thinking_of_you: 0,
      care_about_you: 0,
    };

    const loveExpressionsByContact: Record<string, Record<string, number>> = {};

    processedMessages.forEach(msg => {
      Object.entries(msg.loveExpressions).forEach(([type, count]) => {
        totalLoveExpressions[type] += count;

        if (!loveExpressionsByContact[msg.sender]) {
          loveExpressionsByContact[msg.sender] = { ...totalLoveExpressions };
          Object.keys(loveExpressionsByContact[msg.sender]).forEach(key => {
            loveExpressionsByContact[msg.sender][key] = 0;
          });
        }
        loveExpressionsByContact[msg.sender][type] += count;
      });
    });

    // Response time analysis
    const responseTimes = calculateResponseTimes(processedMessages);
    const averageResponseTimesByContact: Record<string, number> = {};

    const responseTimesByContact: Record<string, number[]> = {};
    responseTimes.forEach(rt => {
      if (!responseTimesByContact[rt.responder])
        responseTimesByContact[rt.responder] = [];
      responseTimesByContact[rt.responder].push(rt.responseTimeMinutes);
    });

    Object.entries(responseTimesByContact).forEach(([contact, times]) => {
      averageResponseTimesByContact[contact] =
        times.reduce((a, b) => a + b, 0) / times.length;
    });

    // Message length analysis
    const averageMessageLengthByContact: Record<string, number> = {};
    const messageLengthsByContact: Record<string, number[]> = {};

    processedMessages.forEach(msg => {
      if (!messageLengthsByContact[msg.sender])
        messageLengthsByContact[msg.sender] = [];
      messageLengthsByContact[msg.sender].push(msg.messageLength);
    });

    Object.entries(messageLengthsByContact).forEach(([contact, lengths]) => {
      averageMessageLengthByContact[contact] =
        lengths.reduce((a, b) => a + b, 0) / lengths.length;
    });

    // Emoji analysis
    const allEmojis: string[] = [];
    const emojisByContact: Record<string, number> = {};

    processedMessages.forEach(msg => {
      allEmojis.push(...msg.emojis);
      emojisByContact[msg.sender] =
        (emojisByContact[msg.sender] || 0) + msg.emojiCount;
    });

    const emojiFrequency: Record<string, number> = {};
    allEmojis.forEach(emoji => {
      emojiFrequency[emoji] = (emojiFrequency[emoji] || 0) + 1;
    });

    const topEmojis = Object.entries(emojiFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    const analysis: MessageAnalysis = {
      totalMessages,
      mostActiveContact,
      averagePerDay,
      topWords,
      contactCounts,

      // Advanced analytics
      messagesByHour,
      messagesByWeekday,
      messagesByDate,
      averageSentimentByContact,
      averageResponseTimesByContact,
      averageMessageLengthByContact,
      topEmojis,
      emojisByContact,

      // Time-based insights
      mostActiveHour:
        Object.entries(messagesByHour).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "0",
      mostActiveDay:
        Object.entries(messagesByWeekday).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "Monday",

      // Summary stats
      totalEmojis: allEmojis.length,
      averageSentiment:
        processedMessages.reduce((sum, msg) => sum + msg.sentiment, 0) /
        processedMessages.length,

      // First and last message dates
      firstMessageDate:
        processedMessages.length > 0
          ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString()
          : "",
      lastMessageDate:
        processedMessages.length > 0
          ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString()
          : "",
    };

    res.status(200).json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Analysis failed";
    res.status(500).json({ message: errorMessage });
  }
}
