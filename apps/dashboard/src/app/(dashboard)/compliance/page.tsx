import { ComplianceSection } from '@/components/compliance/ComplianceSection';
import { seedChecklist } from '@/lib/seed-checklist';

export default function CompliancePage() {
  const initialTasks = seedChecklist();
  return <ComplianceSection initialTasks={initialTasks} />;
}
