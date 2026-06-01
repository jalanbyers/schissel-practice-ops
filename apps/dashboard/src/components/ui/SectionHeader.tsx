interface SectionHeaderProps {
  title: string;
  desc: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, desc, actions }: SectionHeaderProps) {
  return (
    <div className="sec-head">
      <div>
        <h1 className="sec-title">{title}</h1>
        <p className="sec-desc">{desc}</p>
      </div>
      {actions && <div className="sec-actions">{actions}</div>}
    </div>
  );
}
