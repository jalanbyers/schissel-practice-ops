import { FinancesSection } from '@/components/finances/FinancesSection';
import { seedFinances } from '@/lib/seed-finances';

export default function FinancesPage() {
  const initialFinances = seedFinances();
  return <FinancesSection initialFinances={initialFinances} />;
}
