import { GlobalWithFetchMock } from 'jest-fetch-mock';
import { makePost } from './makePost';
import { encodeBodyPost } from './encodeBodyPost';
const fetch = (global as GlobalWithFetchMock).fetch;

const validResponse = { something: 'beautiful' };

describe('makePost', () => {
  it('should make a post request on the given url with encoded body', async () => {
    fetch.mockResponseOnce(JSON.stringify(validResponse));

    const url = 'http://www.google.com';
    const body = { someKey: 'someValue', someOtherKey: 'someOtherValue' };
    const extraHeaders = { 'X-Custom-Header': 'test' };

    await makePost({ url, body, extraHeaders });

    const expectedCall: ReadonlyArray<any> = [
      url,
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...extraHeaders,
        },
        body: encodeBodyPost(body),
      },
    ];
    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0]).toEqual(expectedCall);
  });
});
