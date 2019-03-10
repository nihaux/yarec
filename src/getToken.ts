import { BadAuthorizationCodeError } from './errors';
import { ScopeEnum } from './types';
import { makePost } from './utils/makePost';
import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { validateTokenResponse } from './utils/validateTokenResponse';
import { parseTokenResponse } from './utils/parseTokenResponse';

export type CommonGetAccessTokenArgs = {
  readonly redirectUri: string;
  readonly clientId: string;
  readonly clientSecret?: string;
};

export type WithCodeGetAccessTokenArgs = { readonly code: string } & CommonGetAccessTokenArgs;
export type AppOnlyGetAccessTokenArgs = CommonGetAccessTokenArgs;
export type GetAccessTokenArgs = WithCodeGetAccessTokenArgs | AppOnlyGetAccessTokenArgs;

export type GetAccessTokenResponse = {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly scope: ReadonlyArray<ScopeEnum>;
  readonly refreshToken?: string;
};

const isWithCode = (params: GetAccessTokenArgs): params is WithCodeGetAccessTokenArgs => {
  return (params as any).code !== undefined;
};

export const getToken = async (params: GetAccessTokenArgs): Promise<GetAccessTokenResponse> => {
  const { clientId, clientSecret, redirectUri } = params;
  const url = 'https://www.reddit.com/api/v1/access_token';
  const extraHeaders = getBasicAuthHeader({ clientId, clientSecret });

  const response = await makePost({
    url,
    body: isWithCode(params)
      ? { grant_type: 'authorization_code', code: params.code, redirect_uri: redirectUri }
      : {
          grant_type: clientSecret
            ? 'client_credentials'
            : 'https://oauth.reddit.com/grants/installed_client',
          device_id: 'DO_NOT_TRACK_THIS_DEVICE',
          redirect_uri: redirectUri,
        },
    extraHeaders,
  });

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
