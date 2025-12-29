import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'conversation-logs');

interface LogEntry {
  timestamp: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    name: string;
    input: unknown;
    result?: unknown;
  }>;
}

interface ConversationLog {
  sessionId: string;
  startedAt: string;
  messages: LogEntry[];
}

// Ensure logs directory exists
function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

// Generate a session ID
export function generateSessionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${dateStr}_${timeStr}_${random}`;
}

// Get log file path for a session
function getLogPath(sessionId: string): string {
  return path.join(LOGS_DIR, `${sessionId}.json`);
}

// Initialize a new conversation log
export function initConversationLog(sessionId: string): void {
  ensureLogsDir();
  const log: ConversationLog = {
    sessionId,
    startedAt: new Date().toISOString(),
    messages: [],
  };
  fs.writeFileSync(getLogPath(sessionId), JSON.stringify(log, null, 2));
}

// Append a message to the conversation log
export function logMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: Array<{ name: string; input: unknown; result?: unknown }>
): void {
  ensureLogsDir();
  const logPath = getLogPath(sessionId);

  let log: ConversationLog;

  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  } else {
    log = {
      sessionId,
      startedAt: new Date().toISOString(),
      messages: [],
    };
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    sessionId,
    role,
    content,
  };

  if (toolCalls && toolCalls.length > 0) {
    entry.toolCalls = toolCalls;
  }

  log.messages.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

// Log the full messages array from a chat request
export function logConversation(
  sessionId: string,
  messages: Array<{ role: string; content: string | unknown }>
): void {
  ensureLogsDir();
  const logPath = getLogPath(sessionId);

  const log: ConversationLog = {
    sessionId,
    startedAt: new Date().toISOString(),
    messages: messages.map((msg) => ({
      timestamp: new Date().toISOString(),
      sessionId,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    })),
  };

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

// Get all conversation logs
export function getAllLogs(): ConversationLog[] {
  ensureLogsDir();
  const files = fs.readdirSync(LOGS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf-8');
    return JSON.parse(content);
  });
}

// Get a specific conversation log
export function getLog(sessionId: string): ConversationLog | null {
  const logPath = getLogPath(sessionId);
  if (fs.existsSync(logPath)) {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  }
  return null;
}

// =============================================================================
// FEEDBACK LOGGING
// =============================================================================

const FEEDBACK_DIR = path.join(process.cwd(), 'feedback-logs');

interface Feedback {
  sessionId: string | null;
  rating: 'helpful' | 'somewhat' | 'not_helpful';
  issues: string[];
  comment?: string;
  timestamp: string;
  conversationSnapshot?: ConversationLog | null;
}

function ensureFeedbackDir() {
  if (!fs.existsSync(FEEDBACK_DIR)) {
    fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
  }
}

// Save feedback with conversation snapshot
export function saveFeedback(feedback: Omit<Feedback, 'conversationSnapshot'>): void {
  ensureFeedbackDir();

  // Get conversation snapshot if sessionId exists
  let conversationSnapshot: ConversationLog | null = null;
  if (feedback.sessionId) {
    conversationSnapshot = getLog(feedback.sessionId);
  }

  const fullFeedback: Feedback = {
    ...feedback,
    conversationSnapshot,
  };

  // Generate feedback file name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rating = feedback.rating;
  const feedbackPath = path.join(FEEDBACK_DIR, `${timestamp}_${rating}.json`);

  fs.writeFileSync(feedbackPath, JSON.stringify(fullFeedback, null, 2));
}

// Get all feedback entries
export function getAllFeedback(): Feedback[] {
  ensureFeedbackDir();
  const files = fs.readdirSync(FEEDBACK_DIR).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(FEEDBACK_DIR, file), 'utf-8');
    return JSON.parse(content);
  });
}

// Get feedback summary stats
export function getFeedbackStats(): {
  total: number;
  helpful: number;
  somewhat: number;
  notHelpful: number;
  commonIssues: Record<string, number>;
} {
  const feedback = getAllFeedback();

  const stats = {
    total: feedback.length,
    helpful: 0,
    somewhat: 0,
    notHelpful: 0,
    commonIssues: {} as Record<string, number>,
  };

  for (const f of feedback) {
    if (f.rating === 'helpful') stats.helpful++;
    else if (f.rating === 'somewhat') stats.somewhat++;
    else if (f.rating === 'not_helpful') stats.notHelpful++;

    for (const issue of f.issues) {
      stats.commonIssues[issue] = (stats.commonIssues[issue] || 0) + 1;
    }
  }

  return stats;
}
