"use client";

export default function ContactsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Contacts</div>
      <p className="mt-1 text-sm text-zinc-400">
        Saved people, numbers, notes, preferred language, and autofill profiles.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: contact cards, profile memory (name/email/company), and past
        completion history per person.
      </div>
    </div>
  );
}

