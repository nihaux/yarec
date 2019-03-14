import { encodeBodyPost } from './encodeBodyPost';
import { BadClientCredentialsError, RedditBackendError } from '../errors';

type MakePostArgs = {
  readonly url: string;
  readonly body: Record<string, string>;
  readonly extraHeaders?: Record<string, string>;
};

export const makePost = async ({ url, body, extraHeaders }: MakePostArgs) => {
  const encodedBody = encodeBodyPost(body);

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...extraHeaders,
    },
    body: encodedBody,
  });

  if (response.status === 401) {
    throw new BadClientCredentialsError();
  }

  if (response.status >= 500) {
    throw new RedditBackendError();
  }
  return response;
};
