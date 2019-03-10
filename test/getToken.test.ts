import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { getToken } from '../src/getToken';
import {
  BadAuthorizationCodeError,
  BadClientCredentialsError,
  RedditBackendError,
  RedditIncompleteResponseError,
} from '../src/errors';

const fetch = (global as GlobalWithFetchMock).fetch;

const clientId = 'toto';
const clientSecret = 'totosecret';
const redirectUri = 'http://toto.website/callback';
const code = 'asdfasdfjhsdkfhsdf';

const accessParams = { clientId, clientSecret, redirectUri, code };

const validResponse = {
  access_token: 'asdf',
  token_type: 'bearer',
  expires_in: 3600,
  scope: 'read',
};

describe('getAccessToken', () => {
  it('should make a POST request to the token endpoint', async () => {
    fetch.mockResponseOnce(JSON.stringify(validResponse));
    await getToken(accessParams);

    const expectedCall: ReadonlyArray<any> = [
      'https://www.reddit.com/api/v1/access_token',
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic dG90bzp0b3Rvc2VjcmV0',
        },
        body:
          'grant_type=authorization_code&code=asdfasdfjhsdkfhsdf&redirect_uri=http%3A%2F%2Ftoto.website%2Fcallback',
      },
    ];

    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0]).toEqual(expectedCall);
  });
  it('should throw if reddit returns 401', async () => {
    fetch.mockResponseOnce('whatever', { status: 401 });
    expect(getToken(accessParams)).rejects.toEqual(new BadClientCredentialsError());
  });
  it('should throw if body contains error', async () => {
    const error = 'something bad happened';
    fetch.mockResponseOnce(JSON.stringify({ error }));
    expect(getToken(accessParams)).rejects.toEqual(new Error(error));

    const invalidGrantError = 'invalid_grant';
    fetch.mockResponseOnce(JSON.stringify({ error: invalidGrantError }));
    expect(getToken(accessParams)).rejects.toEqual(new BadAuthorizationCodeError());
  });
  it('should throw if body does not contains all mandatory values', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ access_token: 'asf', token_type: 'bearer', expires_in: 3600 }),
    );
    expect(getToken(accessParams)).rejects.toEqual(new RedditIncompleteResponseError(['scope']));

    fetch.mockResponseOnce(JSON.stringify({ token_type: 'bearer', expires_in: 3600 }));
    expect(getToken(accessParams)).rejects.toEqual(
      new RedditIncompleteResponseError(['access_token', 'scope']),
    );
    fetch.mockResponseOnce(
      JSON.stringify({ access_token: 'asf', token_type: 'bearer', scope: 'read' }),
    );
    expect(getToken(accessParams)).rejects.toEqual(
      new RedditIncompleteResponseError(['expires_in']),
    );
  });
  it('should throw if reddit return 5xx response', async () => {
    fetch.mockResponseOnce('whatever', { status: 502 });
    expect(getToken(accessParams)).rejects.toEqual(new RedditBackendError());
  });
});
