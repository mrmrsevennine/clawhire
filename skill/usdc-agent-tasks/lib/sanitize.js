/**
 * Task Input Sanitization — Prompt Injection Prevention
 * 
 * Blocks known prompt injection patterns, enforces length limits,
 * and strips dangerous content from task descriptions.
 */

const BLOCKED_PATTERNS = [
  // Prompt injection
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\bact\s+as\b/i,
  /\brole\s*play\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b/,
  
  // Dangerous commands
  /transfer\s+all/i,
  /send\s+all\s+(usdc|tokens|funds|crypto|eth|matic)/i,
  /private\s*key/i,
  /seed\s*phrase/i,
  /mnemonic/i,
  /\bsudo\b/,
  /\brm\s+-rf\b/,
  /\bformat\s+[cCdD]:/,
  /\bdel\s+\/[sS]/,
  
  // Code injection
  /<script/i,
  /javascript\s*:/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bFunction\s*\(/i,
  /on(load|error|click|mouse)\s*=/i,
  /data\s*:\s*text\/html/i,
  
  // Social engineering
  /urgent.*transfer/i,
  /emergency.*send/i,
  /reward.*private.*key/i,
];

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MIN_TITLE_LENGTH = 3;

/**
 * Sanitize and validate task input
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {{ valid: boolean, errors: string[], sanitizedTitle: string, sanitizedDescription: string }}
 */
export function sanitizeTaskInput(title, description = '') {
  const errors = [];
  
  // Length validation
  if (!title || title.trim().length < MIN_TITLE_LENGTH) {
    errors.push(`Title too short (min ${MIN_TITLE_LENGTH} chars)`);
  }
  if (title && title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title too long (max ${MAX_TITLE_LENGTH} chars)`);
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description too long (max ${MAX_DESCRIPTION_LENGTH} chars)`);
  }
  
  // Prompt injection detection
  const combined = `${title || ''} ${description || ''}`;
  const detectedThreats = [];
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(combined)) {
      detectedThreats.push(pattern.source);
    }
  }
  
  if (detectedThreats.length > 0) {
    errors.push(`⚠️ Potentially malicious content detected (${detectedThreats.length} patterns matched)`);
  }
  
  // Sanitize — strip HTML tags
  const sanitizedTitle = stripHtml(title || '').trim();
  const sanitizedDescription = stripHtml(description || '').trim();
  
  return {
    valid: errors.length === 0,
    errors,
    threats: detectedThreats,
    sanitizedTitle,
    sanitizedDescription,
  };
}

/**
 * Strip HTML tags from text
 */
function stripHtml(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Log security event for monitoring
 */
export function logSecurityEvent(type, details) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ...details,
  };
  console.warn(`🛡️ SECURITY [${type}]:`, JSON.stringify(event));
  // Future: Send to monitoring service
}
