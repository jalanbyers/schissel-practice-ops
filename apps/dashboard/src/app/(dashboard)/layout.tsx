import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth';
import { extractTenantId } from '@/lib/tenant';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsProvider } from '@/components/providers/SettingsContext';
import {
  MOCK_SETTINGS, MOCK_STATES, MOCK_PAYERS,
  MOCK_ENGAGEMENTS, MOCK_CHECKLIST,
} from '@/lib/mock-data';

/**
 * Dashboard shell layout — server component.
 *
 * Wraps the entire (dashboard) tree with <SettingsProvider> so that
 * SettingsSection can call updateProfile() and the Sidebar brand block
 * re-renders immediately without a page reload.
 *
 * Data flow:
 *   SettingsProvider (client boundary, holds PracticeProfile in state)
 *     ↓  usePracticeProfile()
 *   Sidebar → brand block reads profile.name / profile.entity live
 *     ↓  updateProfile()
 *   SettingsSection → calls updateProfile() on Save, also PATCHes /v1/settings
 */
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
        <Sidebar
          user={user}
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
    </SettingsProvider>
  );
}
