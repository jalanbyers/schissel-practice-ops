import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Verified tenant ID from the Auth0 JWT. Set before any route handler runs. */
    tenantId: string;
    /** Auth0 subject (user ID). */
    userId: string;
    /** Roles from the JWT's custom claim. */
    userRoles: string[];
    /** True when the JWT's `amr` claim includes 'mfa'. */
    mfaVerified: boolean;
  }
}
