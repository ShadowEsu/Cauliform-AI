"use client";

/** Animated voice bars — CSS-driven, mobile-friendly */
export function VoiceVisualizer({
  active,
  speaking,
  bars = 24,
  className = "",
}: {
  active: boolean;
  speaking: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-end justify-center gap-[3px] h-14 ${className}`}
      role="img"
      aria-label={speaking ? "Agent speaking" : active ? "Listening" : "Idle"}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full origin-bottom ${
            active && speaking
              ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-voice-bar"
              : active
                ? "bg-amber-300/80 animate-voice-idle"
                : "bg-stone-300 dark:bg-zinc-600"
          }`}
          style={{
            animationDelay: `${(i % 8) * 80}ms`,
            height: active && speaking ? undefined : active ? "20%" : "12%",
          }}
        />
      ))}
    </div>
  );
}
