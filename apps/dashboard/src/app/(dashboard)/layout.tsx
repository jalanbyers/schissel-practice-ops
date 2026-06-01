import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth';
import { extractTenantId } from '@/lib/tenant';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import {
  MOCK_SETTINGS, MOCK_STATES, MOCK_PAYERS,
  MOCK_ENGAGEMENTS, MOCK_CHECKLIST,
} from '@/lib/mock-data';

/**
 * Dashboard shell layout — server component.
 *
 * 1. Gets the Auth0 session; redirects to /login if unauthenticated.
 * 2. Extracts tenant_id from the access token (for downstream API calls).
 * 3. Renders Sidebar + TopBar, passing the authenticated user for display.
 *
 * After step 2 (TanStack Query wiring), the sidebar counts come from
 * authenticated API responses rather than MOCK_* constants.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  // Middleware handles the redirect in production; this is a belt-and-suspenders
  // guard for environments where middleware may be bypassed (e.g. unit tests).
  if (!session) redirect('/login');

  // Get a fresh access token — needed to extract tenant_id and for API calls.
  const { token } = await auth0.getAccessToken();
  const tenantId = extractTenantId(token);

  const user = {
    name:    session.user.name    ?? session.user.email ?? 'User',
    email:   session.user.email   ?? '',
    picture: session.user.picture ?? undefined,
    tenantId,
  };

  return (
    <div className="app">
      <Sidebar
        user={user}
        settings={MOCK_SETTINGS}
        states={MOCK_STATES}
        payers={MOCK_PAYERS}
        engagements={MOCK_ENGAGEMENTS}
        checklist={MOCK_CHECKLIST}
      />
      <div className="main">
        <TopBar title="Overview" date={MOCK_SETTINGS.today} />
        <div className="scroll">{children}</div>
      </div>
    </div>
  );
}
