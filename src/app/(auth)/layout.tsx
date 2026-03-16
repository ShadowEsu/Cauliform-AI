export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/25 via-amber-500/20 to-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full bg-rose-600/10 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}

