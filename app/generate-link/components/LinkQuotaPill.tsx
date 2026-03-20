export default function LinkQuotaPill({ linksLeft }: { linksLeft: number }) {
    const danger = linksLeft <= 1;
  
    return (
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1",
          danger
            ? "bg-red-500/10 text-red-200 ring-red-500/30"
            : "bg-white/10 text-white/80 ring-white/10",
        ].join(" ")}
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-green-400" />
        Te quedan <span className="text-white">{linksLeft}</span> links gratis
        <span className="text-white/50">•</span>
        Luego, soporte
      </div>
    );
  }
  