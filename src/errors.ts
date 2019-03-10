// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

export class BadClientCredentialsError extends Error {
  constructor() {
    super('Bad clientId and/or clientSecret');
    Object.setPrototypeOf(this, BadClientCredentialsError.prototype);
  }
}

export class BadAuthorizationCodeError extends Error {
  constructor() {
    super('The authorization code has expired or already been used');
    Object.setPrototypeOf(this, BadAuthorizationCodeError.prototype);
  }
}

export class RedditBackendError extends Error {
  constructor() {
    super('Reddit is having issues (return 5xx code)');
    Object.setPrototypeOf(this, RedditBackendError.prototype);
  }
}

export class RedditIncompleteResponseError extends Error {
  constructor(notInResponse: ReadonlyArray<string>) {
    super(`Mandatory value(s) missing in reddit response: ${notInResponse.join(',')}`);
    Object.setPrototypeOf(this, RedditIncompleteResponseError.prototype);
  }
}
