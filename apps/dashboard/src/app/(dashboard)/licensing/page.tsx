import { LicensingSection } from '@/components/licensing/LicensingSection';
import { seedLicenses } from '@/lib/seed-licenses';

// Server component — seeds initial license data server-side.
// No PHI persisted client-side; the list lives in React state after hydration.
// Step 4+: replace seedLicenses() with an authenticated API fetch.
export default function LicensingPage() {
  const initialLicenses = seedLicenses();
  return <LicensingSection initialLicenses={initialLicenses} />;
}
