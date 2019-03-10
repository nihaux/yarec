interface RedditClientInterface {}

type RedditClientConstructorArgs = {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly clientSecret?: string;
};

export default class RedditClient implements RedditClientInterface {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly clientSecret?: string;

  constructor({ clientId, redirectUri, clientSecret }: RedditClientConstructorArgs) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.clientSecret = clientSecret;
  }
}
