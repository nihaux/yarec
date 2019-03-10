import { getAuthorizationUrl } from './authorization';
import { AuthorizationDurationEnum, ScopeEnum } from './types';

describe('authorization', () => {
  describe('getAuthorizationUrl', () => {
    it('should construct a correct authorization url', () => {
      const clientId = 'asdfqwerg';
      const state = 'myStateString';
      const redirectUri = 'myapp://callback';
      const duration = AuthorizationDurationEnum.permanent;
      const scopes: ReadonlyArray<ScopeEnum> = [
        ScopeEnum.account,
        ScopeEnum.identity,
        ScopeEnum.vote,
      ];
      const expectedUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=${duration}&scope=${scopes.join(
        ',',
      )}`;

      expect(getAuthorizationUrl({ clientId, redirectUri, duration, scopes, state })).toEqual(
        expectedUrl,
      );
    });
    it('should add .compact for mobile', () => {
      const clientId = 'asdfqwerg';
      const state = 'myStateString';
      const redirectUri = 'myapp://callback';
      const duration = AuthorizationDurationEnum.permanent;
      const scopes: ReadonlyArray<ScopeEnum> = [
        ScopeEnum.account,
        ScopeEnum.identity,
        ScopeEnum.vote,
      ];
      const mobile = true;
      const expectedUrl = `https://www.reddit.com/api/v1/authorize.compact?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=${duration}&scope=${scopes.join(
        ',',
      )}`;

      expect(
        getAuthorizationUrl({ clientId, redirectUri, duration, scopes, state, mobile }),
      ).toEqual(expectedUrl);
    });
  });
});
