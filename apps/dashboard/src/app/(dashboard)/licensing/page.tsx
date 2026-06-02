import { LicensingSection } from '@/components/licensing/LicensingSection';

// Data is fetched client-side via useLicenses() → /api/data/licenses → Fastify API.
// No seed data imported here — mock data path removed.
export default function LicensingPage() {
  return <LicensingSection />;
}
