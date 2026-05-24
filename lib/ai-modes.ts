export interface AIMode {
  id: string
  name: string
  description: string
  icon: string
}

export const AI_MODES: AIMode[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "Standard Fyy-AI for everyday tasks and helpful conversation",
    icon: "🤖",
  },
  {
    id: "creative",
    name: "Creative Writer",
    description: "Optimized for creative writing, poetry, and brainstorming",
    icon: "✍️",
  },
  {
    id: "coding",
    name: "Code Expert",
    description: "Specialized in programming, debugging, and technical advice",
    icon: "💻",
  },
  {
    id: "research",
    name: "Research Pro",
    description: "Deep analysis, summarization, and factual investigation",
    icon: "🔍",
  },
  {
    id: "image-studio",
    name: "Image Studio",
    description: "Access the image generation engine and creative studio",
    icon: "🎨",
  }
]
