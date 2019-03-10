interface RedditClientInterface {}

type RedditClientConstructorArgs = {
  readonly client_id: string;
  readonly redirect_uri: string;
  readonly client_secret?: string;
  readonly refresh_token?: string;
};

export default class RedditClient implements RedditClientInterface {
  private readonly client_id: string;
  private readonly redirect_uri: string;
  private readonly client_secret?: string;
  private readonly refresh_token?: string;
  // tslint:disable readonly-keyword
  private access_token?: string;

  constructor({
    client_id,
    redirect_uri,
    client_secret,
    refresh_token,
  }: RedditClientConstructorArgs) {
    this.client_id = client_id;
    this.redirect_uri = redirect_uri;
    this.client_secret = client_secret;
    this.refresh_token = refresh_token;
  }
}
