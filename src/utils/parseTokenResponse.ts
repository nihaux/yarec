import { ScopeEnum } from '../types';

export type ParseTokenResponseArgs = {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly scope: string;
  readonly refresh_token?: string;
};

export type ParseTokenResponseResult = {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly scope: ReadonlyArray<ScopeEnum>;
  readonly refreshToken?: string;
};

export const parseTokenResponse = (
  tokenResponse: ParseTokenResponseArgs,
): ParseTokenResponseResult => {
  return {
    accessToken: tokenResponse.access_token,
    expiresIn: tokenResponse.expires_in,
    tokenType: tokenResponse.token_type,
    scope: tokenResponse.scope.split(' ') as ReadonlyArray<ScopeEnum>,
    refreshToken: tokenResponse.refresh_token,
  };
};
