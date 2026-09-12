export default function MainFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Seguridad Cifrada TLS 1.3 · Certificación Bancaria CNBV</span>
        </div>
        <div className="hidden sm:block">© 2026 Grupo Financiero Banorte, S.A.B. de C.V.</div>
        <div className="flex gap-4">
          <a href="#privacidad" className="transition-colors hover:text-slate-700">
            Aviso de Privacidad
          </a>
          <a href="#terminos" className="transition-colors hover:text-slate-700">
            Términos de IA Banorte
          </a>
        </div>
      </div>
    </footer>
  )
}
