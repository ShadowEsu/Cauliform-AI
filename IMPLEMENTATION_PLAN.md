# Implementation Game Plan
## Cauliform - Technical Implementation Guide

**Stack:** Next.js + Vercel + Google Cloud + Gemini Live API

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                              │
│                          Next.js 14 + PWA                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Landing Page          │  Call Status Page    │  Success Page   │    │
│  │  - Google Form URL     │  - "Calling you..."  │  - Confirmation │    │
│  │  - Phone number        │  - Live transcript   │  - Form link    │    │
│  │  - "Call Me" button    │  - Cancel option     │                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ API Routes
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API Routes)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ /api/parse-form  │  │ /api/start-call  │  │ /api/webhook     │       │
│  │ Parse Google Form│  │ Trigger Twilio   │  │ Twilio callbacks │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   Google Forms API   │ │   Gemini Live API    │ │      Twilio          │
│   (Parse questions)  │ │   (Voice AI Agent)   │ │   (Phone calls)      │
│                      │ │   - Real-time STT    │ │   - Outbound calls   │
│   OR: Web scraping   │ │   - Real-time TTS    │ │   - Audio streaming  │
│   as fallback        │ │   - Conversation     │ │   - Webhooks         │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Firebase Firestore  │
                         │  - Session state     │
                         │  - User profiles     │
                         │  - Call history      │
                         └──────────────────────┘
```

---

## Phase 1: Foundation (Days 1-2)

### 1.1 Project Setup ✅
```bash
# Already done
npx create-next-app@latest --typescript --tailwind --app
npm install @google/generative-ai firebase next-pwa twilio
```

### 1.2 Environment Configuration
Create `.env.local`:
```env
# Google AI
GOOGLE_AI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT=your_project_id

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project

# App
NEXT_PUBLIC_APP_URL=https://cauliform.vercel.app
```

### 1.3 PWA Configuration
Create `next.config.ts`:
```typescript
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  // Next.js config
});

export default nextConfig;
```

### 1.4 Folder Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with PWA meta
│   ├── page.tsx            # Landing page (URL + phone input)
│   ├── call/[id]/page.tsx  # Call status page
│   ├── success/page.tsx    # Success confirmation
│   └── api/
│       ├── parse-form/route.ts    # Parse Google Form
│       ├── start-call/route.ts    # Initiate Twilio call
│       ├── webhook/route.ts       # Twilio webhook handler
│       └── submit-form/route.ts   # Submit to Google Form
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── FormInput.tsx       # URL + phone input form
│   ├── CallStatus.tsx      # Real-time call status
│   └── Transcript.tsx      # Live transcript display
├── lib/
│   ├── gemini.ts           # Gemini API wrapper
│   ├── twilio.ts           # Twilio client
│   ├── firebase.ts         # Firebase config
│   ├── form-parser.ts      # Google Form parsing logic
│   └── types.ts            # TypeScript types
└── hooks/
    ├── useCallStatus.ts    # WebSocket for call updates
    └── useFormParser.ts    # Form parsing hook
```

---

## Phase 2: Core Features (Days 3-5)

### 2.1 Google Form Parsing

**Option A: Google Forms API (if form is owned)**
```typescript
// src/lib/form-parser.ts
import { google } from 'googleapis';

export async function parseGoogleForm(formUrl: string) {
  const formId = extractFormId(formUrl);
  const forms = google.forms({ version: 'v1' });

  const response = await forms.forms.get({ formId });

  return response.data.items?.map(item => ({
    id: item.itemId,
    title: item.title,
    type: item.questionItem?.question?.questionId,
    required: item.questionItem?.question?.required,
    options: item.questionItem?.question?.choiceQuestion?.options
  }));
}
```

**Option B: Web Scraping (any public form)**
```typescript
// src/lib/form-parser.ts
import * as cheerio from 'cheerio';

export async function scrapeGoogleForm(formUrl: string) {
  const response = await fetch(formUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const questions: Question[] = [];

  // Parse form structure from HTML
  $('[data-params]').each((_, el) => {
    const params = JSON.parse($(el).attr('data-params') || '[]');
    questions.push({
      id: params[0],
      title: params[1],
      type: mapQuestionType(params[3]),
      options: params[4]?.[0]?.map((opt: any) => opt[0])
    });
  });

  return questions;
}
```

### 2.2 Twilio Voice Integration

```typescript
// src/app/api/start-call/route.ts
import twilio from 'twilio';
import { NextResponse } from 'next/server';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  const { phoneNumber, formUrl, sessionId } = await request.json();

  const call = await client.calls.create({
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER!,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook?session=${sessionId}`,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/status`,
  });

  return NextResponse.json({ callSid: call.sid, sessionId });
}
```

### 2.3 Gemini Live API Integration

```typescript
// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function createVoiceAgent(questions: Question[]) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `You are Cauli, a friendly voice assistant helping users fill out forms.

    QUESTIONS TO ASK:
    ${questions.map((q, i) => `${i + 1}. ${q.title} (${q.type})`).join('\n')}

    INSTRUCTIONS:
    - Greet the user warmly
    - Ask one question at a time
    - For multiple choice, read all options
    - Confirm understanding before moving on
    - At the end, summarize all answers and ask for confirmation
    - Be conversational and handle interruptions gracefully`
  });

  return model;
}
```

### 2.4 Real-time Audio Streaming (Twilio ↔ Gemini)

```typescript
// src/app/api/webhook/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  const twiml = new twilio.twiml.VoiceResponse();

  // Connect to WebSocket for real-time streaming
  const connect = twiml.connect();
  connect.stream({
    url: `wss://${process.env.NEXT_PUBLIC_APP_URL}/api/stream`,
    track: 'both_tracks'
  });

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' }
  });
}
```

---

## Phase 3: Polish (Days 6-8)

### 3.1 UI Components

**Landing Page:**
```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <img src="/logo.png" alt="Cauliform" className="w-32 mb-8" />
      <h1 className="text-3xl font-bold mb-2">Cauliform</h1>
      <p className="text-gray-600 mb-8">Turn any Google Form into a phone call</p>

      <form className="w-full max-w-md space-y-4">
        <input
          type="url"
          placeholder="Paste Google Form URL..."
          className="w-full p-4 border rounded-lg"
        />
        <input
          type="tel"
          placeholder="Your phone number"
          className="w-full p-4 border rounded-lg"
        />
        <button className="w-full p-4 bg-black text-white rounded-lg">
          Call Me
        </button>
      </form>
    </main>
  );
}
```

### 3.2 Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Invalid URL | "Please enter a valid Google Form link" | Validate on input |
| Form not accessible | "This form is private or doesn't exist" | Show error state |
| Call failed | "Couldn't connect. Check your number" | Retry button |
| Voice unclear | "Sorry, I didn't catch that. Could you repeat?" | Re-prompt |

### 3.3 Interruption Handling

```typescript
// Gemini Live API supports barge-in natively
// When user speaks, it stops TTS and processes input
const liveConfig = {
  responseModalities: ["AUDIO"],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Aoede"  // Natural female voice
      }
    }
  }
};
```

---

## Phase 4: Deploy & Demo (Days 9-11)

### 4.1 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### 4.2 Demo Checklist

- [ ] **Happy path demo** (30 sec form completion)
- [ ] **Interruption demo** (user cuts off AI mid-sentence)
- [ ] **Multiple choice demo** (AI reads options)
- [ ] **Confirmation flow** (AI reads back answers)
- [ ] **Error recovery** (unclear response handling)

### 4.3 Video Script (4 min max)

| Time | Content |
|------|---------|
| 0:00-0:30 | Problem statement + hook |
| 0:30-1:30 | Live demo - paste URL, receive call, answer questions |
| 1:30-2:30 | Show key features (interruption, confirmation) |
| 2:30-3:15 | Architecture diagram + tech explanation |
| 3:15-3:45 | User testimonials (optional) |
| 3:45-4:00 | Call to action + team |

---

## Google Tech Stack Summary

| Google Product | Usage |
|----------------|-------|
| **Gemini Live API** | Real-time voice AI agent (mandatory) |
| **Google GenAI SDK** | SDK for Gemini integration (mandatory) |
| **Firebase Firestore** | Session state, user profiles |
| **Firebase Auth** | Google OAuth (optional) |
| **Google Forms API** | Parse form structure |
| **Google Cloud Run** | Alternative backend hosting |

---

## Daily Milestones

| Day | Milestone | Success Criteria |
|-----|-----------|------------------|
| 1 | Env setup + basic UI | Can input URL and phone |
| 2 | Twilio integration | Can make outbound call |
| 3 | Form parsing works | Extract questions from any form |
| 4 | Gemini voice agent | Basic Q&A conversation |
| 5 | Full flow integration | Form → Call → Questions → Submit |
| 6 | Error handling | Graceful failures |
| 7 | UI polish | Looks demo-ready |
| 8 | Interruption handling | Barge-in works smoothly |
| 9 | Deploy to Vercel | Live URL working |
| 10 | Record demo video | < 4 min, shows all features |
| 11 | Submit to Devpost | All deliverables complete |

---

## Quick Start Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Vercel
vercel --prod

# Test Twilio locally (with ngrok)
ngrok http 3000
```

---

## Key Files to Implement

1. `src/app/page.tsx` - Landing page UI
2. `src/app/api/parse-form/route.ts` - Form parsing endpoint
3. `src/app/api/start-call/route.ts` - Twilio call initiation
4. `src/app/api/webhook/route.ts` - Twilio webhook handler
5. `src/lib/gemini.ts` - Gemini Live API wrapper
6. `src/lib/form-parser.ts` - Google Form parsing logic

---

*Last updated: March 5, 2026*
