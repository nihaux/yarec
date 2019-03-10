import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { BadClientCredentialsError, MissingRefreshTokenError, RedditBackendError } from './errors';
import { refreshToken } from './refreshToken';
import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { encodeBodyPost } from './utils/encodeBodyPost';

const fetch = (global as GlobalWithFetchMock).fetch;

const refreshParams = {
  clientId: 'toto',
  clientSecret: 'traverseEnDehorsDesClous',
  redirectUri: 'appli://callback',
  refreshToken: 'qwersdfasdfdsghjksafjd',
};

const validResponse = {
  access_token: 'asdf',
  token_type: 'bearer',
  expires_in: 3600,
  scope: 'read write',
};
describe('refreshToken', () => {
  it('should make a POST request to the token endpoint', async () => {
    fetch.mockResponseOnce(JSON.stringify(validResponse));
    await refreshToken(refreshParams);

    const expectedCall: ReadonlyArray<any> = [
      'https://www.reddit.com/api/v1/access_token',
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...getBasicAuthHeader({
            clientId: refreshParams.clientId,
            clientSecret: refreshParams.clientSecret,
          }),
        },
        body: encodeBodyPost({
          grant_type: 'refresh_token',
          refresh_token: refreshParams.refreshToken,
        }),
      },
    ];

    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0]).toEqual(expectedCall);
  });
  it('should return a formatted response', async () => {
    fetch.mockResponseOnce(JSON.stringify(validResponse));
    const response = await refreshToken(refreshParams);
    expect(response).toEqual({
      accessToken: validResponse.access_token,
      expiresIn: validResponse.expires_in,
      scope: validResponse.scope.split(' '),
      tokenType: validResponse.token_type,
    });
  });
  it('should throw if refresh token missing from request', async () => {
    fetch.mockResponseOnce(JSON.stringify({ refresh_token: 'NO_TEXT' }));
    expect(refreshToken(refreshParams)).rejects.toEqual(new MissingRefreshTokenError());
  });
  it('should throw if reddit returns 401', async () => {
    fetch.mockResponseOnce('whatever', { status: 401 });
    expect(refreshToken(refreshParams)).rejects.toEqual(new BadClientCredentialsError());
  });
  it('should throw if reddit return 5xx response', async () => {
    fetch.mockResponseOnce('whatever', { status: 502 });
    expect(refreshToken(refreshParams)).rejects.toEqual(new RedditBackendError());
  });
});
