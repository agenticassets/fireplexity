# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fireplexity v2 is an AI-powered search engine that combines web search, news, and image results using Firecrawl and Groq APIs. It's built as a Next.js 15 application with TypeScript, React 19, and Tailwind CSS.

## Essential Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server  
- `npm run lint` - Run ESLint (note: ESLint errors are ignored during builds via next.config.ts)

## Environment Setup

Required environment variables (see `.env.example`):
- `FIRECRAWL_API_KEY` - API key from firecrawl.dev for search functionality
- `GROQ_API_KEY` - API key from console.groq.com for AI text generation

The app supports runtime API key input via modal if environment variables aren't set.

## Architecture

### Core Components
- `app/page.tsx` - Main application entry point with search/chat interface switching
- `app/api/fireplexity/search/route.ts` - Primary API endpoint handling search requests
- `app/chat-interface.tsx` - Chat UI for conversational search experience
- `app/search.tsx` - Initial search form component

### API Integration
- **Firecrawl v2 API**: Web scraping and search (web, news, images) via direct API calls
- **Groq AI**: Text generation using `moonshotai/kimi-k2-instruct` model
- **AI SDK**: Streaming responses with custom data parts for sources, status updates, and follow-up questions

### State Management
- Uses `@ai-sdk/react` useChat hook for message handling
- Custom streaming data parts for:
  - `data-sources`: Search results (web, news, images)
  - `data-ticker`: Stock symbol detection for financial queries
  - `data-followup`: AI-generated follow-up questions
  - `data-status`: Real-time search progress updates

### UI Components
- **shadcn/ui** components with custom theme (components.json configured)
- **Tailwind CSS** with custom orange brand color (#ff4d00)
- **Next.js Image** optimization with permissive remote patterns
- **Sonner** for toast notifications

### Key Libraries
- `@ai-sdk/groq` and `@ai-sdk/react` for AI integration
- `@mendable/firecrawl-js` for web scraping
- `react-markdown` with `remark-gfm` for content rendering
- `shiki` for code syntax highlighting
- `zod` for data validation

## Development Notes

### Content Processing
- `lib/content-selection.ts` - Intelligent content excerpting for AI context
- `lib/company-ticker-map.ts` - Company name to stock ticker detection
- Search results are processed through content selection to stay within AI context limits

### Error Handling
- Comprehensive error handling in API routes with user-friendly messages
- Graceful fallbacks for missing API keys (runtime modal input)
- Error display components for search failures

### Performance Optimizations
- Turbopack for faster development builds
- Next.js 15 App Router with React Server Components
- Streaming responses for real-time user feedback
- Image optimization for search result thumbnails

### File Structure
- `app/` - Next.js 15 App Router pages and API routes
- `components/` - Reusable UI components (shadcn/ui based)
- `lib/` - Utility functions and business logic
- `public/` - Static assets including Firecrawl branding

The application follows Next.js 15 App Router conventions with TypeScript strict mode enabled.