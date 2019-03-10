import { Base64 } from 'js-base64';

export type GetBasicAuthHeaderArgs = {
  readonly clientId: string;
  readonly clientSecret?: string;
};
export type GetBasicAuthHeaderResult = {
  readonly Authorization: string;
};
export const getBasicAuthHeader = ({
  clientId,
  clientSecret,
}: GetBasicAuthHeaderArgs): GetBasicAuthHeaderResult => {
  return { Authorization: `Basic ${Base64.encode(clientId + ':' + (clientSecret || ''))}` };
};
