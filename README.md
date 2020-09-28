# move-semver-tags-action

![](https://github.com/kellyselden/move-semver-tags-action/workflows/CI/badge.svg)
![](https://github.com/kellyselden/move-semver-tags-action/workflows/Publish/badge.svg)
[![npm version](https://badge.fury.io/js/move-semver-tags-action.svg)](https://badge.fury.io/js/move-semver-tags-action)

Move your SemVer major and minor tags automatically

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
