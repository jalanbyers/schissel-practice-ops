import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth';
import { extractTenantId } from '@/lib/tenant';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsProvider } from '@/components/providers/SettingsContext';
import { MOCK_SETTINGS } from '@/lib/mock-data';

/**
 * Same server-only flag as middleware.ts.
 *
 * The middleware already allowed anonymous access but this layout did not, so
 * the dashboard could not be opened without a configured Auth0 tenant — the
 * bypass was half-implemented: enough to skip the middleware, not enough to
 * render a page.
 */
const ALLOW_ANONYMOUS = process.env['DEMO_ALLOW_ANONYMOUS'] === 'true';

interface ShellUser {
  name: string;
  email: string;
  picture: string | undefined;
  tenantId: string;
}

const MOCK_USER: ShellUser = {
  name:    'Dr. Schissel (mock)',
  email:   'mock@schissel.local',
  picture: undefined,
  tenantId: 'tenant-mock',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: ShellUser = MOCK_USER;

  if (!ALLOW_ANONYMOUS) {
    const session = await auth0.getSession();
    if (!session) redirect('/login');

    const { token } = await auth0.getAccessToken();
    const tenantId = extractTenantId(token);

    user = {
      name:    session.user.name    ?? session.user.email ?? 'User',
      email:   session.user.email   ?? '',
      picture: session.user.picture ?? undefined,
      tenantId,
    };
  }

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
