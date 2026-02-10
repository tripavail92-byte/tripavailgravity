import * as jose from 'jsr:@panva/jose@6';

export type VerifiedSupabaseJwt = {
  userId: string;
  payload: jose.JWTPayload;
};

function getAuthToken(req: Request): string {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) throw new Error("Auth header is not 'Bearer {token}'");
  return token;
}

function createSupabaseJwks(supabaseUrl: string) {
  return jose.createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
}

function getSupabaseIssuer(supabaseUrl: string): string {
  return Deno.env.get('SB_JWT_ISSUER') ?? `${supabaseUrl}/auth/v1`;
}

export async function verifySupabaseJwtFromRequest(req: Request, supabaseUrl: string): Promise<VerifiedSupabaseJwt> {
  const token = getAuthToken(req);

  const { payload } = await jose.jwtVerify(token, createSupabaseJwks(supabaseUrl), {
    issuer: getSupabaseIssuer(supabaseUrl),
  });

  const userId = typeof payload.sub === 'string' ? payload.sub : '';
  if (!userId) throw new Error('JWT missing sub claim');

  return { userId, payload };
}
