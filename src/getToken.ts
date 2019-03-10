import 'cross-fetch/polyfill';
import { Base64 } from 'js-base64';
import {
  BadClientCredentialsError,
  BadAuthorizationCodeError,
  RedditBackendError,
  RedditIncompleteResponseError,
} from './errors';
import { ScopeEnum } from './types';

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
  const bodyObject = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  };
  const encodedBody = Object.entries(bodyObject)
    .map(([key, value]) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    })
    .join('&');

  const baseUrl = 'https://www.reddit.com/api/v1/access_token';
  const response = await fetch(baseUrl, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Base64.encode(clientId + ':' + clientSecret || '')}`,
    },
    body: encodedBody,
  });

  if (response.status === 401) {
    throw new BadClientCredentialsError();
  }

  if (response.status >= 500) {
    throw new RedditBackendError();
  }

  const jsonResponse = await response.json();

  if (jsonResponse.error) {
    if (jsonResponse.error === 'invalid_grant') {
      throw new BadAuthorizationCodeError();
    }
    throw new Error(jsonResponse.error);
  }

  const mandatoryValues: ReadonlyArray<string> = [
    'access_token',
    'token_type',
    'expires_in',
    'scope',
  ];
  const jsonResponseKeys = Object.keys(jsonResponse);
  const notInResponse = mandatoryValues.filter(value => !jsonResponseKeys.includes(value));

  if (notInResponse.length > 0) {
    throw new RedditIncompleteResponseError(notInResponse);
  }

  return {
    accessToken: jsonResponse.access_token,
    expiresIn: jsonResponse.expires_in,
    tokenType: jsonResponse.token_type,
    scope: jsonResponse.scope.split(' '),
    refreshToken: jsonResponse.refresh_token,
  };
};
