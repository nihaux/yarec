export type TokenResponse = {
  readonly token_type: 'bearer';
  readonly access_token: string;
  readonly scope: ReadonlyArray<ScopeEnum>;
  readonly expires_in: number;
};
export enum AuthorizationDurationEnum {
  temporary = 'temporary',
  permanent = 'permanent',
}

export type ErrorResponse = {
  message: string;
  error: number;
};

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

export enum KindEnum {
  Comment = 'Comment',
  Account = 'Account',
  Link = 'Link',
  Message = 'Message',
  Subreddit = 'Subreddit',
  Award = 'Award',
  Listing = 'Listing',
}

export interface Thing {
  id: string;
  name: string;
  kind: KindEnum;
  data: any;
}

/**
 * The fullname of the listing that follows before this page. null if there is no previous page.
 */
export interface Listing<T> {
  kind: KindEnum.Listing;
  data: {
    before: string | null;
    after: string | null;
    modhash: string | null;
    children: { kind: string; data: T }[];
  };
}

export interface Votable {
  ups: number;
  downs: number;
  likes: boolean | null;
}

export interface Created {
  created: number;
  created_utc: number;
}

export interface WithAuthor {
  author: string | null;
  author_flair_background_color: string | null;
  author_flair_css_class: string | null;
  author_flair_richtext: string[];
  author_flair_template_id: string | null;
  author_flair_text: string | null;
  author_flair_text_color: string | null;
  author_flair_type: string; // text
  author_fullname: string;
  author_patreon_flair: boolean;
}

export interface Saveable {
  saved: boolean | null;
}

export interface WithScore {
  score: number;
}
export interface InSubreddit {
  subreddit: string;
  subreddit_id: string;
  subreddit_name_prefixed: string;
  subreddit_subscribers: number;
  subreddit_type: string;
}

export interface Banable {
  banned_at_utc: number | null;
  banned_by: string | null;
}
export interface Gildable {
  gilded: number;
  gildings: { gid_1: number; gid_2: number; gid_3: number };
}

export interface Comment
  extends Thing,
    Votable,
    Created,
    WithAuthor,
    Saveable,
    InSubreddit,
    Gildable,
    Banable {
  approved_by: string | null;
  banned_by: string | null;
  body: string;
  body_html: string;
  edited: boolean | number;
  gilded: number;
  link_author?: string;
  link_id: string;
  link_title?: string;
  link_url?: string;
  num_reports: number | null;
  parent_id: string;
  replies: Comment[];
  score_hidden: boolean;
}

export interface Link
  extends Thing,
    Votable,
    Created,
    WithAuthor,
    Saveable,
    WithScore,
    InSubreddit,
    Banable {
  approved_at_utc: number | null;
  approved_by: string | null;
  archived: boolean;
  can_gild: boolean;
  can_mod_post: boolean;
  category: string | null;
  clicked: false;
  content_categories: string[];
  contest_mode: boolean;
  domain: string;
  edited: false | number;
  hidden: boolean;
  hide_score: boolean;
  is_crosspostable: boolean;
  is_meta: boolean;
  is_original_content: boolean;
  is_reddit_media_domain: boolean;
  is_robot_indexable: boolean;
  is_self: boolean;
  is_video: false;
  link_flair_background_color: string;
  link_flair_css_class: string | null;
  link_flair_richtext: string[];
  link_flair_template_id: string | null;
  link_flair_text: string | null;
  link_flair_text_color: string | null;
  link_flair_type: string | null;
  locked: boolean;
  media: any;
  media_embed: any;
  media_only: boolean;
  mod_note: string | null;
  mod_reason_by: string | null;
  mod_reason_title: string | null;
  mod_reports: string[];
  no_follow: boolean;
  num_comments: number;
  num_crossposts: number;
  num_reports: number | null;
  over_18: boolean;
  parent_whitelist_status: string;
  permalink: string;
  pinned: boolean;
  pwls: number;
  quarantine: boolean;
  removal_reason: string | null;
  report_reasons: string | null;
  secure_media: any | null;
  secure_media_embed: any;
  selftext: string;
  selftext_html: string;
  send_replies: boolean;
  spoiler: boolean;
  stickied: boolean;
  suggested_sort: string | null;
  thumbnail: string;
  thumbnail_height: number | null;
  thumbnail_width: number | null;
  title: string;
  url: string;
  user_reports: string[];
  view_count: number | null;
  visited: boolean;
  whitelist_status: string;
  wls: number;
}
