import { Base64 } from 'js-base64';

export type GetBasicAuthHeaderArgs = {
  readonly client_id: string;
  readonly client_secret?: string;
};
export type GetBasicAuthHeaderResult = {
  readonly Authorization: string;
};
export const getBasicAuthHeader = ({
  client_id,
  client_secret,
}: GetBasicAuthHeaderArgs): GetBasicAuthHeaderResult => {
  return { Authorization: `Basic ${Base64.encode(client_id + ':' + (client_secret || ''))}` };
};
