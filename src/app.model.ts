export enum Options {
  SYNC_TIME,
  REPOSITORY_OWNERS,
  LOG_LEVEL,
  GITHUB_USER_PUBLIC_URL,
  GITHUB_USER_PRIVATE_URL,
  GITHUB_ORG_URL,
  GITHUB_REPOS_URL,
}

export const DEFAULT_OPTIONS = {
  [Options.SYNC_TIME]: '*/15 * * * *',
  [Options.LOG_LEVEL]: 'log,warn,error',
  [Options.GITHUB_USER_PUBLIC_URL]: 'https://api.github.com/users/',
  [Options.GITHUB_USER_PRIVATE_URL]: 'https://api.github.com/user/repos',
  [Options.GITHUB_ORG_URL]: 'https://api.github.com/orgs/',
  [Options.GITHUB_REPOS_URL]: 'https://api.github.com/repos/',
};
