import { AuthorizationDurationEnum, ScopeEnum } from './types';

export type authorizationConfig = {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly duration: AuthorizationDurationEnum;
  readonly scopes: ReadonlyArray<ScopeEnum>;
  readonly state?: string;
  readonly mobile?: boolean;
};

export const getAuthorizationUrl = ({
  clientId,
  redirectUri,
  duration,
  scopes,
  state,
  mobile,
}: authorizationConfig): string => {
  const url = `https://www.reddit.com/api/v1/authorize${
    mobile ? '.compact' : ''
  }?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=${duration}&scope=${scopes.join(
    ',',
  )}`;
  return url;
};
