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

<p align="center">
  <img src="screenshot.png" alt="Cauliform App Screenshot" width="400">
</p>

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
| **Email** | Resend / SendGrid |
| **Authentication** | Google OAuth (optional) |

## Agent Pipeline

The voice agent follows a structured pipeline: **identify user → parse form → conduct call → confirm → submit → notify**.

```mermaid
flowchart LR
    A[📱 User Input] --> B{Known User?}
    B -->|Yes| C[Load Profile]
    B -->|No| D[Create Profile]
    C --> E[Parse Form]
    D --> E
    E --> F[📞 Initiate Call]
    F --> G[🤖 Gemini Agent]
    G --> H[Ask Questions]
    H --> I[Confirm Answers]
    I --> J[✅ Submit Form]
    J --> K[📧 Send Email]
```

### Call Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Cauliform
    participant G as Gemini Live
    participant F as Google Forms

    U->>C: Paste form URL + phone
    C->>C: Lookup/create user profile
    C->>F: Parse form questions
    C->>U: 📞 Phone call

    loop Each Question
        G->>U: Ask question (pre-fill if known)
        U->>G: Speak answer
        G->>C: Store response
    end

    G->>U: "Confirm your answers..."
    U->>G: "Yes, submit"
    C->>F: Submit responses
    C->>U: 📧 Confirmation email
    G->>U: "Done! Goodbye!"
```

### User Profile System

Phone number is the primary identifier. The agent learns and remembers common responses:

| Field Type | Example Question | Saved As |
|------------|------------------|----------|
| `email` | "What's your email?" | `john@example.com` |
| `fullName` | "What's your name?" | `John Smith` |
| `company` | "Where do you work?" | `Acme Corp` |
| `jobTitle` | "What's your role?" | `Software Engineer` |

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
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Firebase        │  │  Gemini Live API │  │     Twilio       │
│  Firestore       │  │  Voice AI Agent  │  │  Phone Calls     │
│  ─────────────   │  │  ─────────────   │  │  ─────────────   │
│  • User Profiles │  │  • Real-time STT │  │  • Outbound call │
│  • Known Answers │  │  • Real-time TTS │  │  • Audio stream  │
│  • Call Sessions │  │  • Conversation  │  │  • Webhooks      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
┌──────────────────────┐            ┌──────────────────────┐
│    Google Forms      │            │    Email Service     │
│    Parse & Submit    │            │    Confirmation      │
└──────────────────────┘            └──────────────────────┘
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

## TODO: User Profile Storage (Firebase)

Track users by phone number and remember their data over time using Firestore.

**Firebase Config:**
- Project ID: `cauliform-ai-d836f`
- API Key: `AIzaSyBovx3wV8lTZrNzcg4rCb1qcvxljoUhjuA`
- Auth Domain: `cauliform-ai-d836f.firebaseapp.com`

**What to store per user (keyed by phone number):**
- `phoneNumber` — primary identifier
- `name`, `email`, `age`, etc. — learned from past form responses
- `knownResponses` — map of field patterns to saved values (auto-fill future forms)
- `sessions[]` — history of completed form sessions (form title, answers, timestamp)
- `formsCompleted` — count
- `lastActiveAt` — timestamp

**How it connects:**
1. When a call/conversation starts, look up user by phone number in Firestore
2. Pre-fill known answers (e.g., name, email) and confirm with user
3. After form submission, save new responses to user profile
4. Next time the same user fills a form, agent says: "I have your name as Alice — should I use that?"

**Files to implement:**
- `src/lib/user-profile.ts` — CRUD operations for user profiles
- Update `src/hooks/useGeminiLive.ts` — pass known answers to system prompt
- Update `src/app/api/submit-form/route.ts` — save responses after submission

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
