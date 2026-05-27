"use client";

type IconName =
  | "home"
  | "session"
  | "history"
  | "account"
  | "capabilities"
  | "about"
  | "support"
  | "arrow"
  | "arrowL"
  | "mic"
  | "micOff"
  | "pause"
  | "x"
  | "chevD"
  | "refresh"
  | "check";

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  session: (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <path d="M3 12a9 9 0 0 1 14-7" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </>
  ),
  capabilities: <path d="M12 2l2.39 4.84L20 8l-4 3.9L17 18l-5-2.6L7 18l1-6.1L4 8l5.61-1.16L12 2z" />,
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.8.6-2 1-2 2.5" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
    </>
  ),
  arrow: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  arrowL: (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  mic: (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </>
  ),
  micOff: (
    <>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </>
  ),
  x: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  chevD: <polyline points="6 9 12 15 18 9" />,
  refresh: (
    <>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}

export function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M12 10.2h9c.1.5.2 1 .2 1.6 0 5.3-3.5 9-8.8 9-3.8 0-7-2-8.5-5.1l3.1-2.4c.8 2.3 2.9 3.9 5.4 3.9 3.8 0 5.2-2.8 5.4-4.2H12v-2.8z"
      />
      <path
        fill="#34A853"
        d="M3.6 7.1C5.3 4.7 8.4 2.8 12 2.8c2.3 0 4.4.8 5.9 2.2L15.2 7.6c-1-.9-2.3-1.4-3.7-1.4-2 0-3.8 1.2-4.7 2.9L3.6 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M3.6 7.1l3.2 2.3c-.3.7-.5 1.5-.5 2.6 0 1 .2 1.9.5 2.6L3.6 17C2.8 15.5 2.4 13.8 2.4 12s.4-3.5 1.2-4.9z"
      />
      <path
        fill="#EA4335"
        d="M12 21.2c-3.8 0-7-2-8.5-5.1l3.1-2.4c.8 2.3 2.9 3.9 5.4 3.9 1.3 0 2.4-.4 3.2-1l2.9 2.4c-1.5 1.4-3.6 2.2-6.1 2.2z"
      />
    </svg>
  );
}
