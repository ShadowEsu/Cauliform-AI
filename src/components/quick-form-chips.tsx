"use client";

const DEMO_FORMS = [
  {
    label: "Demo survey",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform",
  },
];

export function QuickFormChips({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {DEMO_FORMS.map((f) => (
        <button
          key={f.url}
          type="button"
          onClick={() => onSelect(f.url)}
          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition active:scale-95"
        >
          {f.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.readText?.().then((t) => {
            if (t?.includes("docs.google.com/forms")) onSelect(t.trim());
          });
        }}
        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition active:scale-95"
      >
        Paste from clipboard
      </button>
    </div>
  );
}
