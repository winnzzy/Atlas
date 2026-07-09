export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  status?: string;
  iat?: number;
  exp?: number;
}
