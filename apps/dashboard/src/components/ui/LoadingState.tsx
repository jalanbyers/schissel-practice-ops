interface LoadingStateProps {
  error?: boolean;
  message?: string;
}

export function LoadingState({ error = false, message }: LoadingStateProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: error ? 'var(--bad)' : 'var(--ink-3)',
      fontSize: 13,
      gap: 10,
    }}>
      {error ? (
        <>
          <span style={{ fontSize: 18 }}>⚠</span>
          {message ?? 'Failed to load data. Check your connection and try again.'}
        </>
      ) : (
        <>
          <span
            style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--primary)',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          {message ?? 'Loading…'}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
