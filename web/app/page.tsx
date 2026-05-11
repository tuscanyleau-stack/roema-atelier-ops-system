export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center min-h-screen px-6">
      <div className="text-center max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-8 font-semibold">
          Internal Operations · v0.1
        </p>

        <h1 className="font-display text-7xl font-medium tracking-tight text-zinc-900 leading-[0.95] mb-6">
          Roéma{" "}
          <span className="italic font-normal text-accent">Atelier</span>
        </h1>

        <p className="text-base text-zinc-600 max-w-md mx-auto leading-relaxed">
          Bespoke bridal couture — operations platform for the studio, designers
          and brides.
        </p>

        <div className="mt-14 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
          </span>
          <span>Scaffold live · Dashboard wiring up next</span>
        </div>
      </div>
    </main>
  );
}
