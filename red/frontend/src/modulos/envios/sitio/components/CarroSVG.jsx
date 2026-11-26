import { useEffect, useRef } from 'react'

export default function CarroSVG({ girando = true }) {
  const ref = useRef(null)
  useEffect(() => {
    const svg = ref.current
    if (!svg || typeof svg.pauseAnimations !== 'function') return
    if (girando) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [girando])

  return (
    <svg ref={ref} className="carro-svg" viewBox="0 0 150 76" width="150" height="76"
         role="img" aria-label="Carro de reparto" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="76" cy="68" rx="62" ry="5" fill="rgba(15,23,42,.22)" />
      <rect x="62" y="1" width="28" height="14" rx="2" fill="#c98b3c" />
      <rect x="62" y="1" width="28" height="4" rx="1" fill="#e0a64f" />
      <rect x="74" y="1" width="4" height="14" fill="#f5d9a8" />
      <path d="M10 56 V43 Q10 36 18 34 L40 30 L52 16 Q54 14 58 14 H100 Q104 14 107 17 L122 33 L134 36 Q141 38 141 45 V56 Z" fill="#ffb800" />
      <path d="M10 49 H141 V56 H10 Z" fill="#e0a200" />
      <path d="M57 19 H76 V32 H46 Z" fill="#0d2c6c" />
      <path d="M81 19 H100 Q102 19 104 21 L116 32 H81 Z" fill="#0d2c6c" />
      <path d="M60 21 H70 L62 30 H54 Z" fill="rgba(255,255,255,.25)" />
      <rect x="11" y="39" width="6" height="6" rx="1.5" fill="#ef4444" />
      <rect x="134" y="39" width="6" height="6" rx="1.5" fill="#fff7cc" />
      {[38, 112].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="57" r="12" fill="#0f172a" />
          <g>
            <circle cx={cx} cy="57" r="6" fill="#cbd5e1" />
            <path d={`M${cx} 51 V63 M${cx - 6} 57 H${cx + 6}`} stroke="#64748b" strokeWidth="2" />
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${cx} 57`} to={`360 ${cx} 57`} dur="0.55s" repeatCount="indefinite" />
          </g>
        </g>
      ))}
    </svg>
  )
}
