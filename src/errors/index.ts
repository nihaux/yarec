// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work

export class BadClientCredentialsError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super('Bad clientId and/or clientSecret');
    Object.setPrototypeOf(this, BadClientCredentialsError.prototype);
  }
}
export class BadOauthCredentialsError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super('Bad access_token used as Bearer');
    Object.setPrototypeOf(this, BadOauthCredentialsError.prototype);
  }
}

export class BadAuthorizationCodeError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super('The authorization code has expired or already been used');
    Object.setPrototypeOf(this, BadAuthorizationCodeError.prototype);
  }
}

export class MissingRefreshTokenError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super('Refresh token has not been sent');
    Object.setPrototypeOf(this, MissingRefreshTokenError.prototype);
  }
}

export class RedditBackendError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super('Reddit is having issues (return 5xx code)');
    Object.setPrototypeOf(this, RedditBackendError.prototype);
  }
}

export class RedditIncompleteResponseError extends Error {
  constructor(notInResponse: ReadonlyArray<string>) {
    /* istanbul ignore next line */
    super(`Mandatory value(s) missing in reddit response: ${notInResponse.join(',')}`);
    Object.setPrototypeOf(this, RedditIncompleteResponseError.prototype);
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    /* istanbul ignore next line */
    super(`You don't have sufficient permission to do this (Unauthorized 403)`);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
