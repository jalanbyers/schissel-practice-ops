/**
 * Platform identity. Distinct from the practice profile in Settings: the
 * profile is the tenant (Schissel Medicine, PLLC), this is the product the
 * tenant is using.
 */
export const BRAND = {
  name: 'Telemed.ai',
  /**
   * Deliberately broader than "Global Licensing Platform": licensing is one of
   * five workspaces (licensing, credentialing, engagements, finances,
   * compliance). "Telemedicine" is left implicit — the wordmark already says it.
   */
  tagline: 'Practice Operations Platform',
} as const;
