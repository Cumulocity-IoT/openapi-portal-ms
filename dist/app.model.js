"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTIONS = exports.Options = void 0;
var Options;
(function (Options) {
    Options[Options["SYNC_TIME"] = 0] = "SYNC_TIME";
    Options[Options["REPOSITORY_OWNERS"] = 1] = "REPOSITORY_OWNERS";
    Options[Options["LOG_LEVEL"] = 2] = "LOG_LEVEL";
    Options[Options["GITHUB_USER_PUBLIC_URL"] = 3] = "GITHUB_USER_PUBLIC_URL";
    Options[Options["GITHUB_USER_PRIVATE_URL"] = 4] = "GITHUB_USER_PRIVATE_URL";
    Options[Options["GITHUB_ORG_URL"] = 5] = "GITHUB_ORG_URL";
    Options[Options["GITHUB_REPOS_URL"] = 6] = "GITHUB_REPOS_URL";
})(Options || (exports.Options = Options = {}));
exports.DEFAULT_OPTIONS = {
    [Options.SYNC_TIME]: '*/15 * * * *',
    [Options.LOG_LEVEL]: 'log,warn,error',
    [Options.GITHUB_USER_PUBLIC_URL]: 'https://api.github.com/users/',
    [Options.GITHUB_USER_PRIVATE_URL]: 'https://api.github.com/user/repos',
    [Options.GITHUB_ORG_URL]: 'https://api.github.com/orgs/',
    [Options.GITHUB_REPOS_URL]: 'https://api.github.com/repos/',
};
//# sourceMappingURL=app.model.js.map