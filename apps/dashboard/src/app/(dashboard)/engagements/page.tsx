import { EngagementsSection } from '@/components/engagements/EngagementsSection';
import { seedEngagements } from '@/lib/seed-engagements';

export default function EngagementsPage() {
  const initialEngagements = seedEngagements();
  return <EngagementsSection initialEngagements={initialEngagements} />;
}
