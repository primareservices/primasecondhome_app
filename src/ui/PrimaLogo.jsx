import { BRAND, C } from '../config/theme.js';
import { fontFamily } from '../config/app-config.js';

// Značka: červený štvorec s domčekom (rovnaký motív ako ikona appky) + wordmark.
export function PrimaLogo({ size = 28, wordmark = true, sub }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="22" fill={BRAND.red}/>
        <path d="M50 24 L18 50 H27 V78 H44 V60 H56 V78 H73 V50 H82 Z" fill="#fff"/>
        <rect x="62" y="28" width="7" height="14" fill="#fff"/>
      </svg>
      {wordmark && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <b style={{ fontSize: Math.round(size * 0.5), letterSpacing: '0.04em', color: BRAND.red }}>PRIMA</b>
          {sub && <span style={{ fontSize: Math.round(size * 0.36), fontWeight: 600, color: C.textMuted, letterSpacing: '0.02em' }}>{sub}</span>}
        </span>
      )}
    </span>
  );
}
