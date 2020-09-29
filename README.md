# move-semver-tags-action

![](https://github.com/kellyselden/move-semver-tags-action/workflows/CI/badge.svg)
![](https://github.com/kellyselden/move-semver-tags-action/workflows/Publish/badge.svg)
[![npm version](https://badge.fury.io/js/move-semver-tags-action.svg)](https://badge.fury.io/js/move-semver-tags-action)

Move your SemVer major and minor tags automatically

GitHub Actions do SemVer differently than NPM. NPM uses `^` and `~` to calculate latest major and minor versions, but GitHub Actions makes you create `vX` and `vX.X` tags and move them for every new release. This can get tedious, so this action automates this process for you.

For more information, see https://docs.github.com/en/free-pro-team@latest/actions/creating-actions/about-actions#using-tags-for-release-management and https://github.com/actions/toolkit/issues/214 for backstory.

### As GitHub Action

```yml
- uses: kellyselden/move-semver-tags-action@v2
  with:
    copy-annotations: true # optional, default `false`
```

### As NPM Package

```js
await require('move-semver-tags-action')({
  cwd: process.cwd(), // optional, default `process.cwd()`
  copyAnnotations: true // optional, default `false`
});
```
