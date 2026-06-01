import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CardProps {
  title?: string;
  desc?: string;
  href?: string;         // makes card clickable, renders CTA arrow
  ctaLabel?: string;
  headRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ title, desc, href, ctaLabel = 'View', headRight, className = '', children }: CardProps) {
  const clickable = !!href;
  const inner = (
    <>
      {(title || headRight || href) && (
        <header className="card-head">
          {title && (
            <div>
              <div className="card-title">{title}</div>
              {desc && <div className="card-desc">{desc}</div>}
            </div>
          )}
          {headRight}
          {href && (
            <span className="card-cta">
              {ctaLabel} <ArrowRight size={13} />
            </span>
          )}
        </header>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`card clickable ${className}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </Link>
    );
  }
  return <section className={`card ${className}`}>{inner}</section>;
}
