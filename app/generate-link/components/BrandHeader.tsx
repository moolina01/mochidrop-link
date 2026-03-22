export default function BrandHeader() {
    return (
      <header className="text-center text-white">
        <div className="mx-auto inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg">
            L
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight">LinkDrop</p>
            <p className="text-xs text-white/60 leading-tight">Generador de links de envío</p>
          </div>
        </div>
  
        <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight">
          Crea tu link de envío
        </h1>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">
          Comparte un link con tu cliente para que elija courier, pague el envío y reciba tracking.
        </p>
      </header>
    );
  }
  