# ⚡ NeonAI PWA

A premium, "Neon Noir" themed Progressive Web App for AI Image Generation. Built with Next.js 15, Tailwind CSS 4, and integrated with the Pollinations AI & Airtable ecosystem.

![Neon Noir Dashboard](https://raw.githubusercontent.com/antigravity-ai/previews/main/neon_noir_preview.png)

## ✨ Features

- **🎨 Neon Noir Aesthetic**: A high-fidelity, premium dark-mode interface with oklch-powered neon gradients and glassmorphism.
- **🧠 AI Generation**: Powered by Pollinations AI (GPT-4o-mini for prompt enhancement and Flux for image generation).
- **📊 Airtable Integration**: Syncs system prompts and templates dynamically from your Airtable base.
- **📱 PWA Ready**: Installable on iOS and Android with offline caching and native app feel.
- **🍱 Bento-Grid History**: A stylish, responsive layout for browsing your generation history.
- **💾 Local Persistence**: Saves your generation history locally in the browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui & Radix UI
- **Icons**: Material Symbols
- **API**: Pollinations AI & Airtable

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Environment Setup

Create a `.env.local` file in the root directory and add the following:

```env
POLLINATIONS_API_KEY=your_pollinations_api_key
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=your_table_name
SYSTEM_ENHANCE_PROMPT="You are an expert prompt engineer..."
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## 📱 PWA Support

The app includes a custom Service Worker and a dynamic `manifest.ts` file. To test PWA features locally:
1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Access via HTTPS (or localhost) and look for the "Install" prompt in your browser.

## 🤖 Deployment to Hugging Face Spaces

This project is optimized for deployment on Hugging Face Spaces using the Docker template.

1. Create a new Space on Hugging Face.
2. Select **Docker** as the SDK.
3. Choose the **Next.js** template or use the provided `Dockerfile`.
4. Connect your GitHub repository for automated deployments.

## 📄 License

MIT © 2026 NeonAI Team
