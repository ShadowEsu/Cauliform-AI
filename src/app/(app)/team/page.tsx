"use client";

export default function TeamPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Team</div>
      <p className="mt-1 text-sm text-zinc-400">
        Invite collaborators, assign roles, and manage project members.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: invite by email, roles (Admin/Builder/Viewer), and audit logs for
        prompt/config changes.
      </div>
    </div>
  );
}

