export enum AuthorizationDurationEnum {
  temporary = 'temporary',
  permanent = 'permanent',
}

export enum ScopeEnum {
  account = 'account',
  creddits = 'creddits',
  edit = 'edit',
  flair = 'flair',
  history = 'history',
  identity = 'identity',
  livemanage = 'livemanage',
  modconfig = 'modconfig',
  modcontributors = 'modcontributors',
  modflair = 'modflair',
  modlog = 'modlog',
  modmail = 'modmail',
  modothers = 'modothers',
  modposts = 'modposts',
  modself = 'modself',
  modwiki = 'modwiki',
  modtraffic = 'modtraffic',
  mysubreddits = 'mysubreddits',
  privatemessages = 'privatemessages',
  read = 'read',
  report = 'report',
  save = 'save',
  structuredstyles = 'structuredstyles',
  submit = 'submit',
  subscribe = 'subscribe',
  vote = 'vote',
  wikiedit = 'wikiedit',
  wikiread = 'wikiread',
}

export type authorizationConfig = {
  clientId: string;
  redirectUri: string;
  duration: AuthorizationDurationEnum;
  scopes: ScopeEnum[];
  state?: string;
  mobile?: boolean;
};

export const getAuthorizationUrl = ({
  clientId,
  redirectUri,
  duration,
  scopes,
  state,
  mobile,
}: authorizationConfig): string => {
  const url = `https://www.reddit.com/api/v1/authorize${
    mobile ? '.compact' : ''
  }?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=${duration}&scope=${scopes.join(
    ',',
  )}`;
  return url;
};
