"use client"

/**
 * Input sanitization and validation utilities
 * Prevents XSS, injection attacks, and malformed data
 */

/**
 * Sanitize user text input for chat
 * Removes dangerous characters while preserving readability
 */
export function sanitizeTextInput(text: string, maxLength: number = 2000): string {
  if (!text || typeof text !== 'string') return ''

  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Validate and sanitize file uploads
 */
export function validateFileUpload(
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File too large (max ${maxSize / 1024 / 1024}MB)` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed: ${file.type}` }
  }

  // Additional check: verify filename
  if (!file.name || file.name.includes('..') || file.name.includes('/')) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}

/**
 * Sanitize conversation titles
 */
export function sanitizeConversationTitle(title: string, maxLength: number = 100): string {
  return sanitizeTextInput(title, maxLength)
}

/**
 * Validate API keys format
 */
export function validateAPIKey(key: string, minLength: number = 10): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length < minLength || key.length > 500) return false
  
  // Check for suspicious patterns
  if (key.includes('http') || key.includes(';') || key.includes('--')) {
    return false
  }

  return /^[a-zA-Z0-9_\-\.]+$/.test(key)
}

/**
 * Validate user ID format
 */
export function validateUserID(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  if (id.length > 100) return false
  
  // Only allow alphanumeric and common separators
  return /^[a-zA-Z0-9_\-\.@]+$/.test(id)
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsed = new URL(url)
    // Only allow http/https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Escape HTML for safe display
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Validate rate limit
 */
export function checkRateLimit(key: string, maxRequests: number = 100, windowMs: number = 3600000): boolean {
  try {
    const data = localStorage.getItem(`ratelimit_${key}`)
    const now = Date.now()

    if (!data) {
      localStorage.setItem(`ratelimit_${key}`, JSON.stringify({ count: 1, resetAt: now + windowMs }))
      return true
    }

    const parsed = JSON.parse(data)
    if (now > parsed.resetAt) {
      localStorage.setItem(`ratelimit_${key}`, JSON.stringify({ count: 1, resetAt: now + windowMs }))
      return true
    }

    if (parsed.count >= maxRequests) {
      return false
    }

    parsed.count++
    localStorage.setItem(`ratelimit_${key}`, JSON.stringify(parsed))
    return true
  } catch {
    return false
  }
}
