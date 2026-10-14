# CLAUDE.md – theme-dev-test-child

Test child theme of [wp-app-framework](https://github.com/saijsaij/wp-app-framework) on top of the test theme [theme-dev-test](https://github.com/saijsaij/theme-dev-test) (slug `theme-dev-test-child`, `Template: theme-dev-test`, namespace `dev-test-child`: blocks `dev-test-child/…`, REST `dev-test-child/v1`, PHP `Saij\ThemeDevTestChild\`). Not a product theme: it exercises a child theme with code of its own, which is a framework instance of its own (`ChildTheme::boot()`). Framework principles and rules: the framework's CLAUDE.md and its [documentation](https://saijsaij.github.io/wp-app-framework/); this file covers the child theme.

<!-- Maintainers: keep this file under 200 lines; the README holds commands in full and the spec table. -->

## Rules

- The child theme reaches its parent only through the parent's public interface: `#[ThemeApi]` (`Saij\ThemeDevTest\Api\DevTestApi`) and the parent's public template callables (`theme_dev_test_*`). Templates of the parent and of the test plugin are overridden in `overrides/{slug}/`, never in `src/`.
- Child themes offer no public interface themselves (`#[PublicApi]` and `public: true` are build errors here).
- The browser tests need this child theme active on top of theme-dev-test (`requireChildTheme()`); the test of the plugin override is skipped without [plugin-dev-test](https://github.com/saijsaij/plugin-dev-test).
- Each test deletes exactly what it created; the console guard in `tests/e2e/fixtures.js` is the same as in the test theme.
- Class properties are never `public` (exceptions: block attribute and value classes); everything in this repository is English; other repositories are linked by GitHub URL.

## Commands

Run from a [wp-dev-env](https://github.com/saijsaij/wp-dev-env) checkout next to this repository. Every check must pass without errors or warnings.

```sh
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test-child build-manifest   # output must match the README
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test-child lint             # fix: composer fix
docker compose run --rm tools npm --prefix /workspace/theme-dev-test-child run lint                    # fix: npm run format
docker compose run --rm e2e npm --prefix /workspace/theme-dev-test-child run test:e2e
```

Release build (without the parent theme) and release test with `--child-theme`: see "Release" and "Tests" in the README.

## Keep in sync

- Expected `build-manifest` output in the README when counts change.
- The framework is required as `dev-main`, the parent theme as `require-dev`; after changes are pushed there, `composer update` the package.
- A release tag `v<version>` must equal `Version:` in `style.css`. `with-theme` in `.github/workflows/release.yml` names the parent theme release the child theme is tested on; it must contain the public API and template callables the child theme uses.
- Every GitHub release gets short release notes instead of the generated compare link alone: what the child theme tests anew, the framework version it is built with and the parent theme release it is tested on (`with-theme`), and the compare link last. The release workflow creates the release with `--generate-notes`; once it has passed, replace the text with `gh release edit <tag> --notes-file <file>` (a rerun only uploads the ZIP and keeps the text).
