import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { BadClientCredentialsError, MissingRefreshTokenError, RedditBackendError } from './errors';
import { refreshToken } from './refreshToken';
import { getBasicAuthHeader } from './utils/getBasicAuthHeader';
import { encodeBodyPost } from './utils/encodeBodyPost';

const fetch = (global as GlobalWithFetchMock).fetch;

const refreshParams = {
  client_id: 'toto',
  client_secret: 'traverseEnDehorsDesClous',
  redirect_uri: 'appli://callback',
  refresh_token: 'qwersdfasdfdsghjksafjd',
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
            client_id: refreshParams.client_id,
            client_secret: refreshParams.client_secret,
          }),
        },
        body: encodeBodyPost({
          grant_type: 'refresh_token',
          refresh_token: refreshParams.refresh_token,
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
      ...validResponse,
      scope: validResponse.scope.split(' '),
    });
  });
  it('should throw if refresh token missing from request', async () => {
    fetch.mockResponseOnce(JSON.stringify({ refresh_token: 'NO_TEXT' }));
    // tslint:disable-next-line no-floating-promises
    expect(refreshToken(refreshParams)).rejects.toEqual(new MissingRefreshTokenError());
  });
  it('should throw if reddit returns 401', async () => {
    fetch.mockResponseOnce('whatever', { status: 401 });
    // tslint:disable-next-line no-floating-promises
    expect(refreshToken(refreshParams)).rejects.toEqual(new BadClientCredentialsError());
  });
  it('should throw if reddit return 5xx response', async () => {
    fetch.mockResponseOnce('whatever', { status: 502 });
    // tslint:disable-next-line no-floating-promises
    expect(refreshToken(refreshParams)).rejects.toEqual(new RedditBackendError());
  });
});
