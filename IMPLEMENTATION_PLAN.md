# Implementation Game Plan
## Cauliform - Technical Implementation Guide

**Stack:** Next.js + Google Cloud Run + Gemini Live API + Firebase

---

## Agent Pipeline Overview

The Cauliform agent follows a structured pipeline that manages user identification, form traversal, response collection, and submission confirmation.

```mermaid
flowchart TD
    subgraph Input["📥 Input Layer"]
        A[User enters Google Form URL] --> B[User enters Phone Number]
        B --> C[Click 'Call Me']
    end

    subgraph UserIdentification["👤 User Identification"]
        C --> D{Phone Number<br/>in Database?}
        D -->|Yes| E[Load User Profile<br/>name, email, past responses]
        D -->|No| F[Create New Profile]
        E --> G[Pre-fill Known Answers]
        F --> G
    end

    subgraph FormParsing["📝 Form Parsing"]
        G --> H[Fetch Google Form]
        H --> I[Extract All Questions]
        I --> J[Identify Question Types]
        J --> K[Build Question Queue]
    end

    subgraph CallInitiation["📞 Call Initiation"]
        K --> L[Initiate Twilio Call]
        L --> M[User Answers Phone]
        M --> N[Connect to Gemini Live API]
    end

    subgraph ConversationLoop["🔄 Conversation Loop"]
        N --> O[Greet User by Name]
        O --> P{More Questions?}
        P -->|Yes| Q[Ask Current Question]
        Q --> R[Listen for Response]
        R --> S[Validate & Store Answer]
        S --> T[Move to Next Question]
        T --> P
        P -->|No| U[Summarize All Responses]
    end

    subgraph Confirmation["✅ Confirmation"]
        U --> V{User Confirms?}
        V -->|Yes| W[Submit to Google Form]
        V -->|No| X[Allow Edits]
        X --> P
        W --> Y[Update User Profile]
    end

    subgraph Notification["📧 Notification"]
        Y --> Z[Send Confirmation Email]
        Z --> AA[End Call]
        AA --> BB[Show Success in UI]
    end
```

---

## User Profile Data Model

```mermaid
erDiagram
    USER_PROFILE {
        string id PK
        string phoneNumber UK
        string email
        string firstName
        string lastName
        string preferredName
        timestamp createdAt
        timestamp lastActiveAt
    }

    KNOWN_RESPONSES {
        string id PK
        string userId FK
        string fieldType
        string fieldPattern
        string savedValue
        int usageCount
        timestamp lastUsed
    }

    CALL_SESSION {
        string id PK
        string userId FK
        string formId
        string formTitle
        string status
        timestamp startedAt
        timestamp completedAt
    }

    FORM_RESPONSE {
        string id PK
        string sessionId FK
        string questionId
        string questionText
        string answer
        boolean confirmed
        timestamp answeredAt
    }

    USER_PROFILE ||--o{ KNOWN_RESPONSES : has
    USER_PROFILE ||--o{ CALL_SESSION : initiates
    CALL_SESSION ||--o{ FORM_RESPONSE : contains
```

---

## Detailed Agent State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: App Loaded

    Idle --> Validating: User submits form
    Validating --> Error: Invalid URL/Phone
    Error --> Idle: User corrects input

    Validating --> LookupUser: Valid input
    LookupUser --> LoadProfile: User found
    LookupUser --> CreateProfile: New user
    CreateProfile --> LoadProfile: Profile created

    LoadProfile --> ParsingForm: Profile ready
    ParsingForm --> Error: Form inaccessible
    ParsingForm --> InitiatingCall: Questions extracted

    InitiatingCall --> Ringing: Twilio call started
    Ringing --> Connected: User answers
    Ringing --> Failed: No answer/declined
    Failed --> Idle: User can retry

    Connected --> Greeting: Gemini connected
    Greeting --> AskingQuestion: Greeted user

    AskingQuestion --> ListeningForAnswer: Question asked
    ListeningForAnswer --> ProcessingAnswer: User responds
    ListeningForAnswer --> AskingQuestion: User interrupts
    ProcessingAnswer --> ValidatingAnswer: Answer received

    ValidatingAnswer --> StoringAnswer: Answer valid
    ValidatingAnswer --> ClarifyingQuestion: Answer unclear
    ClarifyingQuestion --> ListeningForAnswer: Re-asked

    StoringAnswer --> AskingQuestion: More questions
    StoringAnswer --> Summarizing: All questions done

    Summarizing --> AwaitingConfirmation: Summary read
    AwaitingConfirmation --> EditingResponses: User wants changes
    EditingResponses --> AskingQuestion: Edit specific answer

    AwaitingConfirmation --> SubmittingForm: User confirms
    SubmittingForm --> SendingEmail: Form submitted
    SendingEmail --> UpdatingProfile: Email sent
    UpdatingProfile --> Completed: Profile updated

    Completed --> [*]: Call ended
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js on Cloud Run)                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Landing Page          │  Call Status Page    │  Success Page       │    │
│  │  - Google Form URL     │  - "Calling you..."  │  - Confirmation     │    │
│  │  - Phone number        │  - Live transcript   │  - Email sent       │    │
│  │  - "Call Me" button    │  - Cancel option     │  - Form responses   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ API Routes
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API Routes)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ /api/      │  │ /api/      │  │ /api/      │  │ /api/      │            │
│  │ parse-form │  │ start-call │  │ webhook    │  │ send-email │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌────────────────────┐  ┌──────────────────────────┐  ┌────────────────────┐
│   Firebase         │  │   Gemini Live API        │  │      Twilio        │
│   Firestore        │  │   (Voice AI Agent)       │  │   (Phone calls)    │
│   ─────────────    │  │   ─────────────────      │  │   ─────────────    │
│   • User Profiles  │  │   • Real-time STT        │  │   • Outbound calls │
│   • Known Answers  │  │   • Real-time TTS        │  │   • Audio stream   │
│   • Call Sessions  │  │   • Conversation State   │  │   • Webhooks       │
│   • Form Responses │  │   • Barge-in Support     │  │                    │
└────────────────────┘  └──────────────────────────┘  └────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   Google Forms API       │
                        │   ─────────────────      │
                        │   • Parse form structure │
                        │   • Submit responses     │
                        └──────────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │   SendGrid / Gmail API   │
                        │   ─────────────────      │
                        │   • Confirmation emails  │
                        │   • Response summary     │
                        └──────────────────────────┘
```

---

## Call Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Firestore
    participant TW as Twilio
    participant GEM as Gemini Live
    participant GF as Google Forms
    participant EM as Email Service

    U->>F: Enter Form URL + Phone
    F->>B: POST /api/start-call

    B->>DB: Lookup user by phone
    alt User exists
        DB-->>B: Return user profile
        B->>B: Load known responses
    else New user
        B->>DB: Create new profile
    end

    B->>GF: Fetch & parse form
    GF-->>B: Return questions[]

    B->>DB: Create call session
    B->>TW: Initiate outbound call
    TW-->>U: Phone rings
    U->>TW: Answer call

    TW->>B: Call connected webhook
    B->>GEM: Initialize conversation

    GEM->>TW: "Hi [Name]! Let's fill out [Form]"
    TW->>U: Play audio

    loop For each question
        GEM->>TW: Ask question
        TW->>U: Play audio
        U->>TW: Speak answer
        TW->>GEM: Stream audio
        GEM->>B: Store response
        B->>DB: Save form_response
    end

    GEM->>TW: "Let me confirm your answers..."
    TW->>U: Play summary
    U->>TW: "Yes, submit"
    TW->>GEM: Confirmation received

    GEM->>B: Submit form
    B->>GF: POST form responses
    GF-->>B: Submission confirmed

    B->>DB: Update user profile
    B->>DB: Mark session complete

    B->>EM: Send confirmation email
    EM-->>U: Email received

    GEM->>TW: "Done! Check your email. Goodbye!"
    TW->>U: Play audio
    TW->>B: Call ended
    B->>F: Update UI (WebSocket)
    F->>U: Show success page
```

---

## User Profile System

### Profile Schema (Firestore)

```typescript
// src/lib/types.ts

interface UserProfile {
  id: string;
  phoneNumber: string;           // Primary identifier (E.164 format)
  email?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;        // "Call me Alex"

  // Auto-learned responses
  knownResponses: {
    [fieldPattern: string]: {    // e.g., "email", "full_name", "company"
      value: string;
      usageCount: number;
      lastUsed: Date;
    };
  };

  // Statistics
  formsCompleted: number;
  totalCallMinutes: number;

  // Timestamps
  createdAt: Date;
  lastActiveAt: Date;
}

interface CallSession {
  id: string;
  userId: string;
  formId: string;
  formUrl: string;
  formTitle: string;

  status: 'pending' | 'calling' | 'in_progress' | 'confirming' |
          'submitted' | 'failed' | 'cancelled';

  currentQuestionIndex: number;
  responses: FormResponse[];

  twilioCallSid?: string;

  startedAt: Date;
  completedAt?: Date;
}

interface FormResponse {
  questionId: string;
  questionText: string;
  questionType: string;
  answer: string;
  confidence: number;           // Voice recognition confidence
  confirmedByUser: boolean;
  answeredAt: Date;
}
```

### User Lookup & Profile Loading

```typescript
// src/lib/user-profile.ts
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export async function getOrCreateUserProfile(phoneNumber: string): Promise<UserProfile> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const userRef = doc(db, 'users', normalizedPhone);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Update last active
    await updateDoc(userRef, { lastActiveAt: new Date() });
    return userSnap.data() as UserProfile;
  }

  // Create new profile
  const newProfile: UserProfile = {
    id: normalizedPhone,
    phoneNumber: normalizedPhone,
    knownResponses: {},
    formsCompleted: 0,
    totalCallMinutes: 0,
    createdAt: new Date(),
    lastActiveAt: new Date(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateUserProfile(
  phoneNumber: string,
  responses: FormResponse[]
): Promise<void> {
  const userRef = doc(db, 'users', normalizePhoneNumber(phoneNumber));

  // Extract learnable fields
  const knownResponses: Record<string, any> = {};

  for (const response of responses) {
    const fieldType = identifyFieldType(response.questionText);
    if (fieldType) {
      knownResponses[`knownResponses.${fieldType}`] = {
        value: response.answer,
        usageCount: increment(1),
        lastUsed: new Date(),
      };
    }
  }

  await updateDoc(userRef, {
    ...knownResponses,
    formsCompleted: increment(1),
    lastActiveAt: new Date(),
  });
}

function identifyFieldType(questionText: string): string | null {
  const patterns: [RegExp, string][] = [
    [/email|e-mail/i, 'email'],
    [/full name|your name/i, 'fullName'],
    [/first name/i, 'firstName'],
    [/last name|surname/i, 'lastName'],
    [/phone|mobile|cell/i, 'phone'],
    [/company|organization|employer/i, 'company'],
    [/job title|position|role/i, 'jobTitle'],
    [/address|street/i, 'address'],
    [/city/i, 'city'],
    [/state|province/i, 'state'],
    [/zip|postal/i, 'zipCode'],
    [/country/i, 'country'],
  ];

  for (const [pattern, fieldType] of patterns) {
    if (pattern.test(questionText)) {
      return fieldType;
    }
  }
  return null;
}
```

---

## Gemini Agent Conversation Logic

```typescript
// src/lib/gemini-agent.ts

export function buildAgentSystemPrompt(
  userProfile: UserProfile,
  formTitle: string,
  questions: Question[]
): string {
  const userName = userProfile.preferredName || userProfile.firstName || 'there';

  const knownAnswersHint = Object.entries(userProfile.knownResponses)
    .map(([field, data]) => `- ${field}: "${data.value}"`)
    .join('\n');

  return `You are Cauli, a friendly and efficient voice assistant helping users fill out forms over the phone.

## USER CONTEXT
- Name: ${userName}
- Phone: ${userProfile.phoneNumber}
${userProfile.email ? `- Email: ${userProfile.email}` : ''}
- Forms completed previously: ${userProfile.formsCompleted}

## KNOWN INFORMATION (use to pre-fill or confirm)
${knownAnswersHint || '(No prior data)'}

## FORM TO COMPLETE
Title: "${formTitle}"

Questions:
${questions.map((q, i) => `${i + 1}. [${q.type}] ${q.title}${q.required ? ' (required)' : ''}`).join('\n')}

## CONVERSATION FLOW
1. GREETING: Start with "Hi ${userName}! I'm Cauli, and I'll help you fill out ${formTitle}. This should only take a couple minutes."

2. FOR EACH QUESTION:
   - If we have a known answer, say: "For [question], I have [known value] on file. Should I use that, or would you like to provide a different answer?"
   - If new question, ask clearly and wait for response
   - For multiple choice: Read ALL options clearly
   - Confirm unclear answers: "Just to confirm, you said [answer], is that right?"

3. SUMMARY: After all questions, read back ALL answers:
   "Great! Let me read back your responses:
   - [Question 1]: [Answer 1]
   - [Question 2]: [Answer 2]
   ...
   Does everything look correct? Say 'yes' to submit, or tell me what you'd like to change."

4. SUBMISSION: After confirmation:
   "Perfect! I'm submitting your form now... Done! You'll receive a confirmation email shortly. Thanks for using Cauliform, ${userName}. Have a great day!"

## VOICE STYLE
- Warm, professional, efficient
- Clear enunciation, natural pacing
- Handle interruptions gracefully (stop talking when user speaks)
- Keep responses concise - this is a phone call, not a chat`;
}
```

---

## Email Notification System

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(
  userEmail: string,
  formTitle: string,
  responses: FormResponse[],
  formUrl: string
): Promise<void> {
  const responseList = responses
    .map(r => `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${r.questionText}</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.answer}</td>
    </tr>`)
    .join('');

  await resend.emails.send({
    from: 'Cauliform <noreply@cauliform.app>',
    to: userEmail,
    subject: `✅ Form Submitted: ${formTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://cauliform.app/logo.png" alt="Cauliform" style="width: 80px; margin-bottom: 20px;">

        <h1 style="color: #333;">Form Submitted Successfully!</h1>

        <p>Hi there,</p>

        <p>Your responses to <strong>${formTitle}</strong> have been submitted successfully.</p>

        <h2 style="color: #666; font-size: 16px; margin-top: 30px;">Your Responses:</h2>

        <table style="width: 100%; border-collapse: collapse;">
          ${responseList}
        </table>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Original form: <a href="${formUrl}">${formUrl}</a>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

        <p style="color: #999; font-size: 12px;">
          This form was completed via Cauliform - voice-powered form filling.
          <br>
          <a href="https://cauliform.app">Learn more</a>
        </p>
      </div>
    `,
  });
}
```

---

## Phase Implementation Timeline

### Phase 1: Foundation (Days 1-2) ✅
- [x] Next.js project setup
- [x] Basic UI (landing page)
- [x] Environment configuration
- [x] Dockerfile for Cloud Run

### Phase 2: User Profile System (Days 3-4)
- [ ] Firebase Firestore setup
- [ ] User profile CRUD operations
- [ ] Phone number normalization
- [ ] Known responses storage

### Phase 3: Form Parsing & Call Flow (Days 5-6)
- [ ] Google Form parsing (scraping + API)
- [ ] Twilio integration
- [ ] Call session management
- [ ] WebSocket for UI updates

### Phase 4: Gemini Agent (Days 7-8)
- [ ] Gemini Live API integration
- [ ] Agent system prompt
- [ ] Question traversal logic
- [ ] Response validation
- [ ] Confirmation flow

### Phase 5: Submission & Notifications (Days 9-10)
- [ ] Google Form submission
- [ ] Email confirmation (Resend/SendGrid)
- [ ] Profile learning & updates
- [ ] Error handling

### Phase 6: Polish & Demo (Days 11)
- [ ] Deploy to Cloud Run
- [ ] End-to-end testing
- [ ] Demo video recording
- [ ] Devpost submission

---

## Key Files to Implement

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `src/lib/user-profile.ts` | User profile CRUD, phone lookup |
| 2 | `src/lib/session.ts` | Call session management |
| 3 | `src/lib/gemini-agent.ts` | Conversation logic & prompts |
| 4 | `src/lib/form-parser.ts` | Google Form extraction |
| 5 | `src/lib/email.ts` | Confirmation emails |
| 6 | `src/app/api/start-call/route.ts` | Call initiation endpoint |
| 7 | `src/app/api/webhook/route.ts` | Twilio webhook handler |
| 8 | `src/app/api/submit-form/route.ts` | Form submission |

---

## Environment Variables

```env
# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT=your_project_id

# Twilio Voice
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://cauliform.run.app
```

---

*Last updated: March 5, 2026*
