import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { makePost } from './utils/makePost';
import { MissingRefreshTokenError } from './errors';
import { validateTokenResponse } from './utils/validateTokenResponse';
import { parseTokenResponse } from './utils/parseTokenResponse';

export type RefreshTokenArgs = {
  readonly refreshToken: string;
  readonly clientId: string;
  readonly clientSecret?: string;
};

export const refreshToken = async ({ refreshToken, clientId, clientSecret }: RefreshTokenArgs) => {
  const url = 'https://www.reddit.com/api/v1/access_token';
  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };
  const extraHeaders = getBasicAuthHeader({ clientSecret, clientId });

  const response = await makePost({ url, body, extraHeaders });

  const jsonResponse = await response.json();

  if (jsonResponse.refresh_token && jsonResponse.refresh_token === 'NO_TEXT') {
    throw new MissingRefreshTokenError();
  }

  validateTokenResponse({ jsonResponse });

  return parseTokenResponse(jsonResponse);
};
