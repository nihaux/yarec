import { GlobalWithFetchMock } from 'jest-fetch-mock';
import RedditClient, {
  SortLinksEnum,
  API_ENDPOINT,
  MIN_REMAINING_REQUEST_THRESHOLD,
} from './index';
import * as getTokenModule from './getToken';
import * as refreshTokenModule from './refreshToken';
import { ScopeEnum } from './types';
import { BadOauthCredentialsError, RedditBackendError } from './errors';

const fetch = (global as GlobalWithFetchMock).fetch;

const client_id = 'toto';
const redirect_uri = 'toto://callback';
const user_agent = 'someuseragent';
const refresh_token = 'orangejuicetoken';

const tokenResponse: getTokenModule.GetAccessTokenResponse = {
  access_token: 'blablabla',
  expires_in: 3600,
  token_type: 'bearer',
  scope: [ScopeEnum.identity],
};

const getTokenSpy = jest.spyOn(getTokenModule, 'getToken');
getTokenSpy.mockResolvedValue(Promise.resolve(tokenResponse));

const refreshTokenSpy = jest.spyOn(refreshTokenModule, 'refreshToken');
refreshTokenSpy.mockResolvedValue(Promise.resolve(tokenResponse));

describe('RedditClient', () => {
  beforeEach(() => {
    fetch.resetMocks();
    getTokenSpy.mockClear();
    refreshTokenSpy.mockClear();
  });
  describe('get access token on first call if needed', () => {
    it('should get a app only token', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponseOnce(JSON.stringify(response));

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
      });
      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      expect(getTokenSpy.mock.calls.length).toEqual(1);
      expect(getTokenSpy.mock.calls[0][0]).toEqual({
        client_id,
        redirect_uri,
        client_secret: undefined,
      });
    });
    it('should get a token from refresh token', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponseOnce(JSON.stringify(response));

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
        refresh_token,
      });
      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      expect(refreshTokenSpy.mock.calls.length).toEqual(1);
      expect(refreshTokenSpy.mock.calls[0][0]).toEqual({
        refresh_token,
        client_id,
        client_secret: undefined,
      });
    });
    it('should get a token only for the first call', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponse(JSON.stringify(response));

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
        refresh_token,
      });

      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });

      expect(fetch.mock.calls.length).toEqual(4);
      expect(refreshTokenSpy.mock.calls.length).toEqual(1);
    });
  });
  describe('rate limiting', () => {
    it('should wait for the rate limit to reset if there is less than MIN_REMAINING_REQUEST_THRESHOLD requests allowed', async () => {
      jest.useFakeTimers();
      const response = { whateverfornow: 'toto' };

      fetch.mockResponse(JSON.stringify(response), {
        headers: {
          'x-ratelimit-remaining': '4',
          'x-ratelimit-reset': '9',
        },
      });
      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
        refresh_token,
      });

      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      // tslint:disable-next-line no-floating-promises
      r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });

      jest.runAllTimers();

      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 9 * 1000);
      jest.useRealTimers();
    });
    it('should not wait if MIN_REMAINING_REQUEST_THRESHOLD not reached', async () => {
      jest.useFakeTimers();
      const response = { whateverfornow: 'toto' };

      fetch.mockResponse(JSON.stringify(response), {
        headers: {
          'x-ratelimit-remaining': MIN_REMAINING_REQUEST_THRESHOLD.toString(),
          'x-ratelimit-reset': '9',
        },
      });
      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
        refresh_token,
      });

      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      // tslint:disable-next-line no-floating-promises
      r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });

      jest.runAllTimers();

      expect(setTimeout).toHaveBeenCalledTimes(0);
      jest.useRealTimers();
    });
  });
  describe('token renewal', () => {
    it('should renew the token and retry the request if server respond with 401', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponses(
        [JSON.stringify(response), { status: 401 }],
        [JSON.stringify(response), { status: 200 }],
      );

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
      });
      const links = await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      expect(getTokenSpy.mock.calls.length).toEqual(2);
      expect(links).toEqual(response);
    });
    it('should throw if server keeps respond 401 despite token renewal', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponses(
        [JSON.stringify(response), { status: 401 }],
        [JSON.stringify(response), { status: 401 }],
        [JSON.stringify(response), { status: 200 }],
      );

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
      });
      expect.assertions(3); // to make sure we pass in catch
      try {
        await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      } catch (e) {
        expect(e).toEqual(new BadOauthCredentialsError());
      }
      expect(getTokenSpy.mock.calls.length).toEqual(2);
      expect(fetch.mock.calls.length).toEqual(2);
    });
  });
  describe('retry when reddit is down', () => {
    it('should retry once by default and throw if still error', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponses(
        [JSON.stringify(response), { status: 500 }],
        [JSON.stringify(response), { status: 502 }],
      );

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
      });
      expect.assertions(2); // to make sure we pass in catch
      try {
        await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });
      } catch (e) {
        expect(e).toEqual(new RedditBackendError());
      }
      expect(fetch.mock.calls.length).toEqual(2);
    });
    it('should retry options.maxRetry times every time wait 1s * retry', async done => {
      jest.useFakeTimers();
      const response = { whateverfornow: 'toto' };
      fetch.mockResponses(
        [JSON.stringify(response), { status: 500 }],
        [JSON.stringify(response), { status: 502 }],
        [JSON.stringify(response), { status: 502 }],
        [JSON.stringify(response), { status: 502 }],
        [JSON.stringify(response), { status: 502 }],
        [JSON.stringify(response), { status: 502 }],
      );

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
        access_token: 'an access token',
        options: { maxRetry: 5 },
      });

      let runAllTimers = true;
      // tslint:disable-next-line no-floating-promises
      expect(r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new }))
        .rejects.toEqual(new RedditBackendError())
        .then(() => {
          expect(fetch.mock.calls.length).toEqual(6);
          expect(setTimeout).toHaveBeenCalledTimes(5);
          expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 0);
          expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 1000);
          expect(setTimeout).toHaveBeenNthCalledWith(3, expect.any(Function), 2000);
          expect(setTimeout).toHaveBeenNthCalledWith(4, expect.any(Function), 3000);
          expect(setTimeout).toHaveBeenNthCalledWith(5, expect.any(Function), 4000);
        })
        .finally(() => {
          runAllTimers = false;
          jest.useRealTimers();
          done();
        });

      /*
        so here..

        during the call to r.getLinks multiple things happened multiple times:
        - await [someFunction]
        - await timeout (aka await setTimeout to resolve)

        we can't await for r.getLinks, otherwise we can't call jest.runAllTimers and the test is stuck

        from what I constated:
        r.getLinks runs until it found the first awaited function (which is not a await timeout)
        then the test takeover and keeps running: if we don't await somewhere in the test then
        it will run until the end before r.getLinks can takeover.
        Once the test is done running, r.getLinks resume and get stuck on await timeout.

        if we await somewhere in the test, then r.getLinks can take over and run to until the next awaited function.
        at some point it will encounter "await timeout" and we will need to call jest.runAllTimers to allow it to go further
        then another awaited function, etc...

        So in order to make it work we have to "ping pong" between the test and the running function.
        Each time one of them await, it allows the other to run until next await.
        So far this loop is how I solve the issue, I'll be glad if you have a better way to do it :)
      */
      while (runAllTimers) {
        // tslint:disable-next-line await-promise
        await jest.runAllTimers();
      }
    });
  });
  describe('getLinks', () => {
    it('should make a fetch call to the api', async () => {
      const response = { whateverfornow: 'toto' };
      fetch.mockResponseOnce(JSON.stringify(response));

      const r = new RedditClient({
        client_id,
        redirect_uri,
        user_agent,
      });

      await r.getLinks({ subredditName: 'nosleep', sort: SortLinksEnum.new });

      const expectedCall: ReadonlyArray<any> = [
        `${API_ENDPOINT}/r/nosleep/new?`,
        {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'User-Agent': user_agent,
          },
        },
      ];

      expect(fetch.mock.calls.length).toEqual(1);
      expect(fetch.mock.calls[0]).toEqual(expectedCall);
    });
  });
});