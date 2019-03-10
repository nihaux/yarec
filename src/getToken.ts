import { BadAuthorizationCodeError } from './errors';
import { ScopeEnum } from './types';
import { makePost } from './utils/makePost';
import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { validateTokenResponse } from './utils/validateTokenResponse';
import { parseTokenResponse } from './utils/parseTokenResponse';

export type GetAccessTokenArgs = {
  readonly code: string;
  readonly redirectUri: string;
  readonly clientId: string;
  readonly clientSecret?: string;
};

export type GetAccessTokenResponse = {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly scope: ReadonlyArray<ScopeEnum>;
  readonly refreshToken?: string;
};

export const getToken = async ({
  code,
  redirectUri,
  clientId,
  clientSecret,
}: GetAccessTokenArgs): Promise<GetAccessTokenResponse> => {
  const url = 'https://www.reddit.com/api/v1/access_token';
  const extraHeaders = getBasicAuthHeader({ clientId, clientSecret });
  const body = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  };

  const response = await makePost({ url, body, extraHeaders });

  const jsonResponse = await response.json();

  if (jsonResponse.error) {
    if (jsonResponse.error === 'invalid_grant') {
      throw new BadAuthorizationCodeError();
    }
    throw new Error(jsonResponse.error);
  }

  validateTokenResponse({ jsonResponse });

  return parseTokenResponse(jsonResponse);
};
