import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import {
  MOCK_SETTINGS, MOCK_STATES, MOCK_PAYERS,
  MOCK_ENGAGEMENTS, MOCK_CHECKLIST,
} from '@/lib/mock-data';

// Route → TopBar title map.
// In a real app this would derive from the pathname server-side.
// For now the TopBar title is passed as a prop from each page.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <Sidebar
        settings={MOCK_SETTINGS}
        states={MOCK_STATES}
        payers={MOCK_PAYERS}
        engagements={MOCK_ENGAGEMENTS}
        checklist={MOCK_CHECKLIST}
      />
      <div className="main">
        {/* TopBar title is injected by each page via a shared slot in a real app.
            For step 3 it's rendered statically per-page via a parallel layout slot
            approach; here we pass a default and pages override via their own header. */}
        <TopBar title="Overview" date={MOCK_SETTINGS.today} />
        <div className="scroll">{children}</div>
      </div>
    </div>
  );
}
