export const uiTokens = {
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
  surface: {
    page: 'min-h-screen bg-slate-950 text-slate-100 antialiased',
    panel: 'border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/30 backdrop-blur',
    subtle: 'border border-white/10 bg-white/[0.03]',
  },
  text: {
    muted: 'text-slate-400',
    soft: 'text-slate-300',
    strong: 'text-white',
  },
} as const
