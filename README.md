<p align="center">
  <img src="./public/logo.png" alt="FYY-AI Logo" width="120" />
</p>

<h1 align="center">FYY-AI — Advanced AI Intelligence Platform</h1>

<p align="center">
  A multimodal AI chat platform powered by Groq LPU inference, featuring voice I/O, image generation, vision analysis, and a fully native Android app via Capacitor.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Groq_API-LPU_Inference-f97316?logo=data:image/svg+xml;base64," alt="Groq" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white" alt="Capacitor" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Model AI** | Switch between Llama 4 Scout, Llama 4 Maverick, Gemma 2 27B, and more |
| 🎙️ **Voice I/O** | Real-time speech-to-text input and text-to-speech output |
| 🖼️ **Image Generation** | AI image generation via HuggingFace inference API |
| 👁️ **Vision Analysis** | Upload images and ask questions about them (multimodal) |
| 🌗 **Theme System** | Multiple themes (Dark, Light, Cyberpunk, Nature, Ocean, Retro, and more) |
| 🌌 **Animated Background** | Interactive 3D space background built with Three.js |
| 🔐 **Authentication** | Secure user accounts via Clerk |
| 🗄️ **Chat History** | Persistent conversations stored in Supabase |
| 📱 **Android App** | Native Android APK via Capacitor hybrid integration |
| ⚡ **PWA Support** | Installable as a Progressive Web App |
| 🛡️ **Security Shield** | Built-in Clerk security shield component |

---

## 🗂️ Project Structure

```
fyy-ai/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── chat/               # Groq chat completion endpoint
│   │   ├── analyze/            # Vision / image analysis endpoint
│   │   ├── image/              # Image generation endpoint
│   │   ├── models/             # Available models listing
│   │   ├── settings/           # User settings API
│   │   └── welcome/            # Welcome message API
│   ├── chat/                   # Main chat UI page
│   ├── developer/              # Developer profile page
│   ├── sign-in/                # Clerk sign-in page
│   ├── sign-up/                # Clerk sign-up page
│   ├── manifest.ts             # PWA manifest
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
│
├── components/
│   ├── animations/             # Reusable animation components
│   ├── chat/                   # Chat UI components
│   ├── settings/               # Settings panel components
│   ├── ui/                     # Base UI components (shadcn/ui)
│   ├── space-background.tsx    # Three.js animated background
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-toggle.tsx        # Theme switcher UI
│
├── hooks/                      # Custom React hooks
│   ├── use-voice-input.ts      # Web Speech API integration
│   ├── use-file-upload.ts      # File upload handler
│   └── use-scroll-animation.ts # Scroll-triggered animations
│
├── lib/                        # Utility libraries
│   ├── api-config.ts           # API key management & health checks
│   ├── ai-modes.ts             # AI mode configurations
│   └── supabase.ts             # Supabase client
│
├── android/                    # Capacitor Android project
├── assets/                     # App icons & splash screens
├── public/                     # Static assets (logo, PWA icons)
├── .env.example                # Environment variables template
├── capacitor.config.ts         # Capacitor configuration
└── next.config.mjs             # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** ≥ 20.x — [nodejs.org](https://nodejs.org)
- **npm** ≥ 10.x (comes with Node.js)
- **Git** — [git-scm.com](https://git-scm.com)

For Android development (optional):
- **Android Studio** with SDK 34+
- **Java JDK 17+**

---

### 1. Clone the Repository

```bash
git clone https://github.com/RapXcode1/fyy-ai.git
cd fyy-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Required
GROQ_API_KEY=gsk_...

# For authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Optional — for image generation
HUGGINGFACE_API_TOKEN=hf_...

# Optional — for persistent chat history
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> See [API Keys](#-api-keys) section below for where to get each key.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 API Keys

| Service | Purpose | Get Key |
|---|---|---|
| **Groq** | AI chat inference (required) | [console.groq.com/keys](https://console.groq.com/keys) |
| **Clerk** | User authentication | [clerk.com](https://clerk.com) |
| **HuggingFace** | Image generation (optional) | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Supabase** | Chat history database (optional) | [app.supabase.com](https://app.supabase.com) |

---

## 🤖 Supported AI Models

FYY-AI uses the **Groq LPU** inference engine for ultra-fast responses. Available models:

| Model | Best For |
|---|---|
| `meta-llama/llama-4-scout-17b-16e-instruct` | Fast, balanced conversations |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Complex reasoning tasks |
| `google/gemma-2-27b-it` | Detailed analytical responses |
| `llama-3.3-70b-versatile` | High-quality versatile tasks |

Models can be switched live from the chat settings panel.

---

## 📱 Android App (Capacitor)

FYY-AI ships as a hybrid Android app using **Capacitor 8**.

### Development Mode (Emulator / USB)

1. Set the server URL in `capacitor.config.ts`:
   ```ts
   url: 'http://10.0.2.2:3000',  // Android emulator
   // or your PC's local IP for physical device
   ```

2. Build the web assets:
   ```bash
   npm run build
   npx cap sync android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

### Production Mode (Self-hosted)

1. Deploy your Next.js app to a VPS or any server (e.g., Railway, Render, your own VPS).
2. Update `capacitor.config.ts` with your domain:
   ```ts
   url: 'https://your-domain.com',
   ```
3. Build and sign the APK from Android Studio.

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```

---

## 🎨 Theming

FYY-AI includes a full theme system with the following presets:

- `dark` — Default dark mode
- `light` — Clean light mode
- `cyberpunk` — Neon cyberpunk aesthetic
- `ocean` — Deep blue ocean tones
- `nature` — Forest green palette
- `retro` — Warm amber retro style
- `sunset` — Purple-orange gradient
- `minimal` — Minimalist monochrome

Themes are persisted to `localStorage` and applied at the root CSS variable level.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **AI Inference** | Groq SDK + HuggingFace Inference API |
| **3D / Animations** | Three.js + Framer Motion |
| **Authentication** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **Mobile** | Capacitor 8 (Android) |
| **Markdown** | react-markdown + remark-gfm |

---

## 📜 License

This project is licensed under the **MIT License**.  
Feel free to use, fork, and modify — attribution appreciated.

---

## 👨‍💻 Developer

**RapXCode**

- GitHub: [@RapXcode1](https://github.com/RapXcode1)
- Instagram: [@rhafialghfr_](https://instagram.com/rhafialghfr_)
- Email: [rapxcode1@gmail.com](mailto:rapxcode1@gmail.com)

---

<p align="center">
  Built with ❤️ by <strong>RapXCode</strong> — FYY-AI © 2026
</p>
