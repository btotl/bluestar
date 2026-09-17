import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ---------- Soft card with an optional tiny stripe motif ---------- */
export function RetroPanel({
  label,
  children,
  chrome = false,
  className = '',
}: {
  label?: string
  children: ReactNode
  chrome?: boolean
  className?: string
}) {
  return (
    <section className={`card ${chrome ? 'card--glow' : ''} ${className}`}>
      {label && (
        <header className="section-head">
          <span className="eyebrow">{label}</span>
          <span className="stripe" aria-hidden="true" style={{ width: 32 }} />
        </header>
      )}
      {children}
    </section>
  )
}

/* ---------- Emboss button ---------- */
type Variant = 'gold' | 'chrome' | 'violet' | 'ghost' | 'text' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  ceremonial?: boolean
  small?: boolean
  to?: string
}

export function EmbossButton({ variant = 'gold', ceremonial, small, className = '', to, children, ...rest }: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'gold' ? `btn--${variant}` : '',
    ceremonial ? 'btn--ceremonial' : '',
    small ? 'btn--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  if (to) {
    return (
      <Link className={cls} to={to}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}

/* ---------- Padlock ---------- */
export function Padlock({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor" stroke="#05060f" strokeWidth="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#05060f" strokeWidth="1" />
      <circle cx="12" cy="15" r="1.6" fill="#05060f" />
      <rect x="11.2" y="15" width="1.6" height="3" fill="#05060f" />
    </svg>
  )
}

export function LockedField({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="locked">
      <Padlock className="locked__pad" />
      <div className="grow">
        <div className="locked__label">{label}</div>
        <div className="locked__value">{value}</div>
        {sub && <div className="faint" style={{ fontSize: 12 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ---------- Bottom sheet ---------- */
export function Sheet({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" aria-hidden="true" />
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

/* ---------- Chip ---------- */
export function Chip({ children, tone }: { children: ReactNode; tone?: 'warn' | 'ok' }) {
  return <span className={`chip ${tone ? `chip--${tone}` : ''}`}>{children}</span>
}
