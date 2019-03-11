import 'cross-fetch/polyfill';
import { getToken } from './getToken';
import { refreshToken } from './refreshToken';
import { encodeBodyPost } from './utils/encodeBodyPost';
import { Link, Listing } from './types';

export enum SortLinksEnum {
  new = 'new',
  hot = 'hot',
  random = 'random',
  rising = 'rising',
  top = 'top',
  controversial = 'controversial',
}
interface RedditClientInterface {}

type RedditClientConstructorArgs = {
  readonly client_id: string;
  readonly redirect_uri: string;
  readonly user_agent: string;
  readonly client_secret?: string;
  readonly refresh_token?: string;
};

const API_ENDPOINT = 'https://oauth.reddit.com';

export default class RedditClient implements RedditClientInterface {
  private readonly client_id: string;
  private readonly redirect_uri: string;
  private readonly user_agent: string;
  private readonly client_secret?: string;
  private readonly refresh_token?: string;
  // tslint:disable readonly-keyword
  private access_token?: string;
  private ratelimit_remaining?: number;
  private ratelimit_reset?: number;

  constructor({
    client_id,
    redirect_uri,
    client_secret,
    refresh_token,
    user_agent,
  }: RedditClientConstructorArgs) {
    this.client_id = client_id;
    this.user_agent = user_agent;
    this.redirect_uri = redirect_uri;
    this.client_secret = client_secret;
    this.refresh_token = refresh_token;
  }

  private fetchAccessToken = async () => {
    if (this.refresh_token) {
      const tokenObject = await refreshToken({
        refresh_token: this.refresh_token,
        client_id: this.client_id,
        client_secret: this.client_secret,
      });
      this.access_token = tokenObject.access_token;
      return;
    }

    const tokenObject = await getToken({
      client_id: this.client_id,
      client_secret: this.client_secret,
      redirect_uri: this.redirect_uri,
    });
    this.access_token = tokenObject.access_token;
  };

  private getFetchOptions = () => ({
    mode: 'cors' as 'cors',
    credentials: 'include' as 'include',
    headers: {
      Authorization: `bearer ${this.access_token}`,
      'User-Agent': this.user_agent,
    },
  });

  private extractRateLimitFromHeaders = (headers: Headers) => {
    const remaining = headers.get('x-ratelimit-remaining');
    if (remaining) {
      this.ratelimit_remaining = parseInt(remaining, 10);
    }
    const reset = headers.get('x-ratelimit-reset');
    if (reset) {
      this.ratelimit_reset = parseInt(reset, 10);
    }
  };

  public get = async ({
    path,
    query,
  }: {
    path: string;
    query?: Record<string, string | boolean | number | undefined>;
  }) => {
    if (!this.access_token) {
      await this.fetchAccessToken();
    }
    let urlWithQuery = `${API_ENDPOINT}${path}`;
    if (query) {
      urlWithQuery = `${API_ENDPOINT}${path}?${encodeBodyPost(query)}`;
    }
    const response = await fetch(urlWithQuery, {
      method: 'GET',
      ...this.getFetchOptions(),
    });
    this.extractRateLimitFromHeaders(response.headers);
    return response.json();
  };

  public getLinks = async ({
    subredditName,
    sort,
    before,
    after,
    count,
  }: {
    subredditName: string;
    sort: SortLinksEnum;
    before?: string;
    after?: string;
    count?: number;
  }): Promise<Listing<Link>> => {
    return this.get({ path: `/r/${subredditName}/${sort}`, query: { before, after, count } });
  };
}
