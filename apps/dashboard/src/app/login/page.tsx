import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

/**
 * Public login landing page.
 *
 * Auth0 middleware redirects unauthenticated users to Auth0's Universal Login
 * directly. This page acts as a fallback and entry point for direct /login
 * navigation.
 */
export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 40,
        textAlign: 'center',
        maxWidth: 360,
        width: '100%',
        boxShadow: 'var(--shadow-hover)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--primary)', color: '#fff',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
        }}>
          <ShieldCheck size={26} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-.01em' }}>
          Schissel Health Status
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 28px' }}>
          Practice operations dashboard · Schissel Medicine, PLLC
        </p>

        <Link
          href="/api/auth/login"
          style={{
            display: 'block',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 9,
            padding: '11px 20px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background .12s',
          }}
        >
          Log in with Auth0
        </Link>

        <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 20 }}>
          MFA is required for write operations.
        </p>
      </div>
    </div>
  );
}
