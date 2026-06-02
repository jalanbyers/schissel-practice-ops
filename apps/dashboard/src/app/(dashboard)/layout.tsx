import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth';
import { extractTenantId } from '@/lib/tenant';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsProvider } from '@/components/providers/SettingsContext';
import { MOCK_SETTINGS } from '@/lib/mock-data';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) redirect('/login');

  const { token } = await auth0.getAccessToken();
  const tenantId = extractTenantId(token);

  const user = {
    name:    session.user.name    ?? session.user.email ?? 'User',
    email:   session.user.email   ?? '',
    picture: session.user.picture ?? undefined,
    tenantId,
  };

  return (
    <SettingsProvider
      initialProfile={{ name: MOCK_SETTINGS.name, entity: MOCK_SETTINGS.entity }}
    >
      <div className="app">
        {/* Sidebar fetches its own counts via useQuery hooks */}
        <Sidebar user={user} />
        <div className="main">
          <TopBar title="Overview" date={MOCK_SETTINGS.today} />
          <div className="scroll">{children}</div>
        </div>
      </div>
    </SettingsProvider>
  );
}
