'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShieldCheck, ClipboardCheck,
  Briefcase, BarChart2, ShieldAlert, Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MockState, MockPayer, MockEngagement, MockCheckItem } from '@/lib/mock-data';
import { usePracticeProfile } from '@/components/providers/SettingsContext';

interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  tenantId: string;
}

interface SidebarProps {
  user: AuthUser;
  // settings prop removed — brand block reads from SettingsContext instead
  states: MockState[];
  payers: MockPayer[];
  engagements: MockEngagement[];
  checklist: MockCheckItem[];
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  count?: number;
}

export function Sidebar({ user, states, payers, engagements, checklist }: SidebarProps) {
  const pathname = usePathname();

  // Live practice name/entity — updates immediately when Settings saves.
  const { profile } = usePracticeProfile();

  const navItems: NavItem[] = [
    { id: 'overview',      label: 'Overview',       href: '/overview',      Icon: LayoutDashboard },
    { id: 'licensing',     label: 'Licensing',      href: '/licensing',     Icon: ShieldCheck,
      count: states.length },
    { id: 'credentialing', label: 'Credentialing',  href: '/credentialing', Icon: ClipboardCheck,
      count: payers.filter(p => p.status !== 'approved').length },
    { id: 'engagements',   label: 'Engagements',    href: '/engagements',   Icon: Briefcase,
      count: engagements.filter(e => e.status === 'active').length },
    { id: 'finances',      label: 'Finances',       href: '/finances',      Icon: BarChart2 },
    { id: 'compliance',    label: 'Compliance',     href: '/compliance',    Icon: ShieldAlert,
      count: checklist.filter(c => c.status !== 'done').length },
  ];

  const initial = profile.name.charAt(0).toUpperCase();
  const isActive = (href: string) =>
    pathname === href || (href !== '/overview' && pathname.startsWith(href));

  return (
    <aside className="sidebar">
      {/* Brand block — re-renders when profile.name/entity changes */}
      <div className="brand">
        <div className="brand-mark">{initial}</div>
        <div>
          <div className="brand-name">{profile.name}</div>
          <div className="brand-sub">{profile.entity}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-label">Practice</div>
        {navItems.map(({ id, label, href, Icon, count }) => (
          <Link key={id} href={href} className={`nav-item${isActive(href) ? ' active' : ''}`}>
            <Icon size={17} />
            <span className="nav-lbl">{label}</span>
            {count !== undefined && <span className="count">{count}</span>}
          </Link>
        ))}

        <div className="nav-label">Account</div>
        <Link href="/settings" className={`nav-item${pathname === '/settings' ? ' active' : ''}`}>
          <Settings2 size={17} />
          <span className="nav-lbl">Settings</span>
        </Link>
      </nav>

      {/* Profile chip — authenticated Auth0 user */}
      <div className="sidebar-foot">
        <div className="profile">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt={user.name}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
            />
          ) : (
            <div className="avatar">
              {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="pinfo">
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{user.email}</div>
          </div>
        </div>
        <a
          href="/api/auth/logout"
          style={{ fontSize: 11, color: 'var(--ink-3)', padding: '4px 8px', display: 'block', textDecoration: 'none' }}
        >
          Sign out
        </a>
      </div>
    </aside>
  );
}
