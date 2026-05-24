/**
 * API Configuration and Validation
 * Centralized API key management and validation
 */

import { z } from "zod"

// Environment variables schema - made optional for build compatibility
const envSchema = z.object({
  HUGGINGFACE_API_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Validate environment variables with defaults
const env = envSchema.parse({
  HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN || "",
  NODE_ENV: process.env.NODE_ENV,
})

// Warn about missing keys in development
if (env.NODE_ENV === "development" && !env.HUGGINGFACE_API_TOKEN) {
  console.warn("⚠️  HuggingFace API token not found. Some features may not work. Please check your .env.local file.")
}

// API Configuration
export const API_CONFIG = {
  // HuggingFace (Free inference available)
  HUGGINGFACE: {
    API_TOKEN: env.HUGGINGFACE_API_TOKEN,
    BASE_URL: "https://api-inference.huggingface.co",
    IMAGE_MODELS: {
      "stable-diffusion": "stabilityai/stable-diffusion-2-1",
      "stable-diffusion-xl": "stabilityai/stable-diffusion-xl-base-1.0",
      "openjourney": "prompthero/openjourney",
      "anything-v4": "andite/anything-v4.0",
    } as const,
    TEXT_MODELS: {
      "flan-t5": "google/flan-t5-base",
      "blenderbot": "facebook/blenderbot-400M-distill",
      "distilgpt2": "distilgpt2",
      "gpt2": "gpt2",
    } as const,
    CONVERSATIONAL_MODELS: {
      "blenderbot": "facebook/blenderbot-400M-distill",
    } as const,
  },

  // Application settings
  APP: {
    NODE_ENV: env.NODE_ENV,
    IS_PRODUCTION: env.NODE_ENV === "production",
    IS_DEVELOPMENT: env.NODE_ENV === "development",
  },
} as const

// API Health Check Functions
export class APIHealthChecker {
  /**
   * Check HuggingFace API connectivity
   */
  static async checkHuggingFaceAPI(): Promise<{ status: "ok" | "error"; message: string }> {
    try {
      // Test with a simple text model
      const testModel = API_CONFIG.HUGGINGFACE.TEXT_MODELS["flan-t5"]
      const response = await fetch(`${API_CONFIG.HUGGINGFACE.BASE_URL}/models/${testModel}`, {
        headers: {
          Authorization: `Bearer ${API_CONFIG.HUGGINGFACE.API_TOKEN}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return {
          status: "ok",
          message: `✅ HuggingFace API connected. Model: ${data.id || testModel}`,
        }
      } else {
        return {
          status: "error",
          message: `❌ HuggingFace API error: ${response.status} ${response.statusText}`,
        }
      }
    } catch (error) {
      return {
        status: "error",
        message: `❌ HuggingFace API connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  /**
   * Run comprehensive API health check
   */
  static async checkAllAPIs(): Promise<{
    huggingface: { status: "ok" | "error"; message: string }
    overall: "ok" | "error"
  }> {
    console.log("🔍 Running API health checks...")

    const huggingfaceResult = await this.checkHuggingFaceAPI()

    const overall = huggingfaceResult.status === "ok" ? "ok" : "error"

    console.log("📊 API Health Check Results:")
    console.log(`HuggingFace API: ${huggingfaceResult.message}`)
    console.log(`Overall Status: ${overall === "ok" ? "✅ APIs healthy" : "❌ Some APIs have issues"}`)

    return {
      huggingface: huggingfaceResult,
      overall,
    }
  }
}

// API Key Validation
export class APIKeyValidator {
  /**
   * Validate HuggingFace API token format
   */
  static isValidHuggingFaceToken(token: string): boolean {
    // HuggingFace tokens start with "hf_" and are followed by random characters
    return /^hf_[a-zA-Z0-9]{34,}$/.test(token)
  }

  /**
   * Validate all API keys
   */
  static validateAllKeys(): { huggingface: boolean; allValid: boolean } {
    const huggingfaceValid = API_CONFIG.HUGGINGFACE.API_TOKEN ? this.isValidHuggingFaceToken(API_CONFIG.HUGGINGFACE.API_TOKEN) : false

    return {
      huggingface: huggingfaceValid,
      allValid: huggingfaceValid,
    }
  }
}

// Export validated environment
export { env as validatedEnv }

// Type exports
export type APIConfig = typeof API_CONFIG
export type HuggingFaceModels = keyof typeof API_CONFIG.HUGGINGFACE.TEXT_MODELS
