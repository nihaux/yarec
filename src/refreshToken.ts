import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { makePost } from './utils/makePost';
import { MissingRefreshTokenError } from './errors';
import { validateTokenResponse } from './utils/validateTokenResponse';

export type RefreshTokenArgs = {
  readonly refresh_token: string;
  readonly client_id: string;
  readonly client_secret?: string;
};

export const refreshToken = async ({
  refresh_token,
  client_id,
  client_secret,
}: RefreshTokenArgs) => {
  const url = 'https://www.reddit.com/api/v1/access_token';
  const body = {
    grant_type: 'refresh_token',
    refresh_token,
  };
  const extraHeaders = getBasicAuthHeader({ client_secret, client_id });

  const response = await makePost({ url, body, extraHeaders });

  const jsonResponse = await response.json();

  if (jsonResponse.refresh_token && jsonResponse.refresh_token === 'NO_TEXT') {
    throw new MissingRefreshTokenError();
  }

  validateTokenResponse({ jsonResponse });

  return {
    ...jsonResponse,
    scope: jsonResponse.scope.split(' '),
  };
};
