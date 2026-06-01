import { CredentialingSection } from '@/components/credentialing/CredentialingSection';
import { seedPayers } from '@/lib/seed-payers';

export default function CredentialingPage() {
  const initialPayers = seedPayers();
  return <CredentialingSection initialPayers={initialPayers} />;
}
