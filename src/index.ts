const EventEmitter = require('eventemitter3');
import { getToken } from './getToken';
import { refreshToken } from './refreshToken';
import { encodeBodyPost } from './utils/encodeBodyPost';
import { Link, Listing, Comment, Thing, Me } from './types';
import { timeout } from './utils/timeout';
import {
  BadOauthCredentialsError,
  NotFoundError,
  RedditBackendError,
  UnauthorizedError,
} from './errors';

export enum SortLinksEnum {
  new = 'new',
  hot = 'hot',
  random = 'random',
  rising = 'rising',
  top = 'top',
  controversial = 'controversial',
}

export type ListingQueryType = {
  sort?: SortLinksEnum;
  before?: string;
  after?: string;
  count?: number;
  limit?: number;
};

export enum VoteDirectionEnum {
  UP = '1',
  DOWN = '-1',
  UNDO = '0',
}

interface RedditClientInterface {}

export type RedditClientOptions = {
  readonly maxRetry: number;
};

export type RedditClientConstructorArgs = {
  readonly client_id: string;
  readonly redirect_uri: string;
  readonly user_agent: string;
  readonly client_secret?: string;
  readonly refresh_token?: string;
  readonly access_token?: string;
  readonly options?: RedditClientOptions;
};

export const API_ENDPOINT = 'https://oauth.reddit.com';
export const MIN_REMAINING_REQUEST_THRESHOLD = 5;
export const TOKEN_EVENT = 'token';

export default class RedditClient implements RedditClientInterface {
  private readonly client_id: string;
  private readonly redirect_uri: string;
  private readonly user_agent: string;
  private readonly maxRetry: number;
  private readonly client_secret?: string;

  private access_token?: string;
  private refresh_token?: string;
  private ratelimit_remaining?: number;
  private ratelimit_reset?: number;
  private inProgress: number;
  private eventEmitter: any;

  constructor({
    client_id,
    redirect_uri,
    client_secret,
    refresh_token,
    user_agent,
    access_token,
    options,
  }: RedditClientConstructorArgs) {
    this.client_id = client_id;
    this.user_agent = user_agent;
    this.redirect_uri = redirect_uri;
    this.client_secret = client_secret;
    this.refresh_token = refresh_token;

    if (access_token) {
      this.access_token = access_token;
    }

    this.eventEmitter = new EventEmitter();

    this.maxRetry = (options && options.maxRetry) || 1;
    this.inProgress = 0;
    // this.access_token = '24628247-KdovbyetN3uXy4XwQvQFTGWTing';
  }

  public setTokens = ({
    access_token,
    refresh_token,
  }: {
    access_token?: string;
    refresh_token?: string;
  }) => {
    this.refresh_token = refresh_token;
    this.access_token = access_token;
  };

  private fetchAccessToken = async () => {
    // @todo handle race condition
    if (this.refresh_token) {
      const tokenObject = await refreshToken({
        refresh_token: this.refresh_token,
        client_id: this.client_id,
        client_secret: this.client_secret,
      });
      this.access_token = tokenObject.access_token;
    } else {
      const tokenObject = await getToken({
        client_id: this.client_id,
        client_secret: this.client_secret,
        redirect_uri: this.redirect_uri,
      });
      this.access_token = tokenObject.access_token;
    }
    this.eventEmitter.emit(TOKEN_EVENT, this.access_token);
  };

  public onToken = (callback: (token: string) => void) => {
    this.eventEmitter.on(TOKEN_EVENT, callback);
  };
  public offToken = (callback: (token: string) => void) => {
    this.eventEmitter.off(TOKEN_EVENT, callback);
  };

  private getFetchOptions = () => ({
    mode: 'cors' as 'cors',
  });

  private getFetchHeaders = () => ({
    Authorization: `Bearer ${this.access_token}`,
    'User-Agent': this.user_agent,
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

  private maybeWait = async () => {
    if (this.ratelimit_remaining === undefined || this.ratelimit_reset === undefined) {
      return;
    }

    const realRemaining = this.ratelimit_remaining - this.inProgress;
    if (realRemaining >= MIN_REMAINING_REQUEST_THRESHOLD) {
      return;
    }
    await timeout(this.ratelimit_reset * 1000);
  };

  private makeRequest = async (
    url: string,
    requestOptions: RequestInit,
    retrying: number = 0,
  ): Promise<Response> => {
    if (!this.access_token) {
      await this.fetchAccessToken();
    }

    await this.maybeWait();

    this.inProgress++;
    const response = await fetch(url, {
      ...this.getFetchOptions(),
      ...requestOptions,
      headers: {
        ...this.getFetchHeaders(),
        ...(requestOptions.headers ? requestOptions.headers : {}),
      },
    });
    this.inProgress--;

    this.extractRateLimitFromHeaders(response.headers);

    if (response.status === 404) {
      throw new NotFoundError(url);
    }
    if (response.status === 403) {
      throw new UnauthorizedError(url);
    }
    if (response.status === 401 && retrying === 0) {
      await this.fetchAccessToken();
      return this.makeRequest(url, requestOptions, 1);
    }
    if (response.status === 401) {
      throw new BadOauthCredentialsError();
    }

    if (response.status >= 500 && this.maxRetry > retrying) {
      await timeout(retrying * 1000);
      return this.makeRequest(url, requestOptions, retrying + 1);
    }
    if (response.status >= 500) {
      throw new RedditBackendError();
    }

    return response;
  };

  private get = async ({
    path,
    query,
  }: {
    path: string;
    query?: Record<string, string | boolean | number | undefined>;
  }) => {
    let urlWithQuery = `${API_ENDPOINT}${path}`;
    if (query) {
      urlWithQuery = `${API_ENDPOINT}${path}?${encodeBodyPost(query)}`;
    }
    const response = await this.makeRequest(urlWithQuery, {
      method: 'GET',
    });
    return response.json();
  };

  private post = async ({
    path,
    body,
  }: {
    path: string;
    body: Record<string, string | number>;
  }) => {
    const url = `${API_ENDPOINT}${path}`;
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodeBodyPost(body),
    });
    return response.json();
  };

  public me = async (): Promise<Me> => {
    return this.get({ path: '/api/v1/me' });
  };

  public vote = async (id: string, dir: VoteDirectionEnum) => {
    const path = `/api/vote`;
    const response = await this.post({
      path,
      body: {
        id,
        dir,
        rank: 2, // no clue what this is for
      },
    });
    return response.json();
  };

  public listSubredditLinks = async (
    subredditName: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    const { sort, ...rest } = (query || {}) as ListingQueryType;
    const path = `/r/${subredditName}${sort ? `/${sort}` : ''}`;
    return this.get({
      path,
      query: rest as Partial<ListingQueryType>,
    });
  };

  public listLinkComments = async (
    subredditName: string,
    linkId: string,
  ): Promise<[Listing<Link>, Listing<Comment>]> => {
    const path = `/r/${subredditName}/comments/${linkId}`;
    return this.get({
      path,
    });
  };

  public getInfo = async <T>(ids: string[]): Promise<Listing<T>> => {
    return this.get({
      path: `/api/info`,
      query: { id: ids.join(',') },
    });
  };

  public async *crawl<P extends [any, ListingQueryType], T extends Thing>(
    apiCall: (...p: P) => Promise<Listing<T>>,
    ...apiCallParams: P
  ) {
    const { before } = apiCallParams[1];

    let [firstParam, listingQuery, ...rest] = apiCallParams;
    let result;
    do {
      result = await apiCall(...([firstParam, listingQuery, ...rest] as P));
      yield result;
      if (before) {
        const firstChild = result.data.children[0];
        if (!firstChild) {
          break;
        }
        listingQuery = {
          ...listingQuery,
          before: firstChild.data.name,
        };
      } else {
        if (!result.data.after) {
          break;
        }
        listingQuery = {
          ...listingQuery,
          after: result.data.after,
        };
      }
    } while (result.data.children.length > 0);
  }

  public getLinks = async (ids: string[]) => {
    return this.getInfo<Link>(ids);
  };

  public listUserSubmitted = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/submitted`, query });
  };

  public listUserComments = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Comment>> => {
    return this.get({ path: `/user/${username}/comments`, query });
  };

  public listUserUpvoted = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/upvoted`, query });
  };

  public listUserDownvoted = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/downvoted`, query });
  };
  public listUserHidden = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/hidden`, query });
  };
  public listUserSaved = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/saved`, query });
  };

  public listUserGilded = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link>> => {
    return this.get({ path: `/user/${username}/gilded`, query });
  };

  public listUserOverview = async (
    username: string,
    query?: ListingQueryType,
  ): Promise<Listing<Link | Comment>> => {
    return this.get({ path: `/user/${username}/overview`, query });
  };
}

export * from './types';
