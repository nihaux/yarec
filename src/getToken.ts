import { BadAuthorizationCodeError } from './errors';
import { ScopeEnum } from './types';
import { makePost } from './utils/makePost';
import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { validateTokenResponse } from './utils/validateTokenResponse';

export type CommonGetAccessTokenArgs = {
  readonly redirect_uri: string;
  readonly client_id: string;
  readonly client_secret?: string;
};

export type WithCodeGetAccessTokenArgs = { readonly code: string } & CommonGetAccessTokenArgs;
export type AppOnlyGetAccessTokenArgs = CommonGetAccessTokenArgs;
export type GetAccessTokenArgs = WithCodeGetAccessTokenArgs | AppOnlyGetAccessTokenArgs;

export type GetAccessTokenResponse = {
  readonly access_token: string;
  readonly token_type: 'bearer';
  readonly expires_in: number;
  readonly scope: ReadonlyArray<ScopeEnum>;
  readonly refresh_token?: string;
};

const isWithCode = (params: GetAccessTokenArgs): params is WithCodeGetAccessTokenArgs => {
  return (params as any).code !== undefined;
};

export const getToken = async (params: GetAccessTokenArgs): Promise<GetAccessTokenResponse> => {
  const { client_id, client_secret, redirect_uri } = params;
  const url = 'https://www.reddit.com/api/v1/access_token';
  const extraHeaders = getBasicAuthHeader({ client_id, client_secret });

  const response = await makePost({
    url,
    body: {
      ...(isWithCode(params) ? { grant_type: 'authorization_code', code: params.code } : {}),
      ...(!isWithCode(params) && client_secret ? { grant_type: 'client_credentials' } : {}),
      ...(!isWithCode(params) && !client_secret
        ? {
            grant_type: 'https://oauth.reddit.com/grants/installed_client',
            device_id: 'DO_NOT_TRACK_THIS_DEVICE',
          }
        : {}),
      redirect_uri,
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

  return {
    ...jsonResponse,
    scope: jsonResponse.scope.split(' '),
  };
};
