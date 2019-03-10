import { RedditIncompleteResponseError } from '../errors';

export type ValidateTokenResponseArgs = {
  readonly jsonResponse: Record<string, string>;
};
export const validateTokenResponse = ({ jsonResponse }: ValidateTokenResponseArgs): void => {
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
};
