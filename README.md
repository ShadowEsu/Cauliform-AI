<p align="center">
  <img src="logo.png" alt="Cauliform Logo" width="300">
</p>

<h1 align="center">Cauliform</h1>

<p align="center">
  <em>Turn any Google Form into a phone call</em>
</p>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#solution">Solution</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

---

Cauliform is an AI-powered voice agent that transforms Google Forms into natural phone conversations. Simply paste a Google Form link, receive a call, and complete the form hands-free while walking, driving, or multitasking.

## The Problem

Google Forms are everywhere—surveys, event registrations, feedback forms, applications. Yet filling them out requires your full attention: you need to stop what you're doing, pull out your device, and manually type responses. This creates friction that leads to abandoned forms, incomplete responses, and missed opportunities.

For users with disabilities, limited mobility, or those constantly on the move, traditional form-filling is even more challenging.

## Solution

Cauliform leverages Google's **Gemini Live API** to create a real-time voice agent that:

1. **Parses** any Google Form link you provide
2. **Calls** you directly on your phone
3. **Asks** each question conversationally
4. **Confirms** your responses before submission
5. **Submits** the completed form automatically

Fill out forms while walking to your car, during your commute, or while cooking dinner—no screens required.

## Key Features

- **Voice-First Experience**: Natural conversational interface powered by Gemini Live API
- **Real-Time Interaction**: Handles interruptions gracefully, just like talking to a human
- **Smart Profile Memory**: Remembers common responses (name, email, etc.) across forms
- **Multi-Format Support**: Handles text responses, multiple choice, checkboxes, and long-form paragraphs
- **Attachment Handling**: For file uploads, receive a text/email prompt to submit attachments
- **Confirmation Flow**: Reviews all responses before final submission
- **Accessibility-First**: Designed for users who prefer or require voice interaction

## Technology Stack

| Component | Technology |
|-----------|------------|
| **AI/ML** | Gemini Live API, Google GenAI SDK |
| **Voice/Telephony** | Twilio Voice API |
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Cloud Infrastructure** | Google Cloud Run |
| **Database** | Firebase Firestore |
| **Authentication** | Google OAuth (optional) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js PWA)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Landing Page   │  │  Call Status    │  │  Success Page   │  │
│  │  URL + Phone    │  │  Live Updates   │  │  Confirmation   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Google Cloud Run)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ /parse-form  │  │ /start-call  │  │  /webhook    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Google Forms    │  │  Gemini Live API │  │     Twilio       │
│  Parse & Submit  │  │  Voice AI Agent  │  │  Phone Calls     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud account with billing enabled
- Twilio account with Voice capabilities
- Google AI Studio API key (Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/ShadowEsu/Cauliform-AI.git
cd Cauliform-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your API keys:

```env
# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=your_gcp_project_id

# Twilio Voice
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Locally

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

## Deployment

### Google Cloud Run (Recommended)

We provide a one-click deployment script for Google Cloud Run:

```bash
# Make the script executable
chmod +x deploy.sh

# Deploy to Cloud Run
./deploy.sh YOUR_PROJECT_ID us-central1
```

The script will:
1. Enable required GCP APIs
2. Build and push the Docker image
3. Deploy to Cloud Run
4. Output your service URL

### Manual Deployment

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT/cauliform .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT/cauliform

# Deploy to Cloud Run
gcloud run deploy cauliform \
  --image gcr.io/YOUR_PROJECT/cauliform \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Post-Deployment

1. Set environment variables in Cloud Run console
2. Update `NEXT_PUBLIC_APP_URL` to your Cloud Run URL
3. Configure Twilio webhook URL to: `https://YOUR_URL/api/webhook`

## Usage

1. **Open Cauliform** in your browser
2. **Paste** a Google Form link
3. **Enter** your phone number
4. **Answer** the call and complete the form conversationally
5. **Confirm** your responses when prompted
6. **Done!** The form is submitted automatically

## Use Cases

- **Students**: Register for events, complete course surveys, submit feedback—all while walking to class
- **Professionals**: Fill out expense reports, HR forms, or client surveys during commute
- **Accessibility**: Voice-first interface for users with visual impairments or motor difficulties
- **Busy Parents**: Complete school forms, medical questionnaires, or community surveys hands-free
- **Field Workers**: Submit reports and checklists without stopping work

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   └── api/
│       ├── parse-form/          # Google Form parser
│       ├── start-call/          # Twilio call initiation
│       └── webhook/             # Twilio callbacks
├── lib/
│   ├── types.ts                 # TypeScript definitions
│   ├── gemini.ts                # Gemini API wrapper
│   ├── firebase.ts              # Firebase configuration
│   └── form-parser.ts           # Form parsing logic
└── components/                  # React components
```

## Documentation

- [PRD.md](PRD.md) - Product Requirements Document
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Technical Implementation Guide

## Hackathon

**Category:** Live Agents - Real-time voice interaction using Gemini Live API

This project is built for the [Gemini Live Agent Challenge](https://devpost.com) hackathon, focusing on breaking the "text box" paradigm with immersive, real-time voice experiences.

### Judging Criteria

| Criteria | Weight |
|----------|--------|
| Innovation & Multimodal UX | 40% |
| Technical Implementation | 30% |
| Demo & Presentation | 30% |

## Team

| Name | Role | Background |
|------|------|------------|
| Preston | Full Stack Developer | Web apps, front-end, minimal design |
| Stella | Product Manager | Banking (JP Morgan, UBS), AI/ML coursework |
| Chinat Yu | Full Stack Developer | Hackathon winner (TreeHacks), experienced builder |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with Gemini Live API for the Gemini Live Agent Challenge 2026
</p>
