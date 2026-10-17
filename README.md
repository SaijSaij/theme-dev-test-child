# theme-dev-test-child

Test child theme of [wp-app-framework](https://github.com/saijsaij/wp-app-framework). It is not a product theme: its block, hook, routes, templates and overrides exist to exercise the framework in a child theme with code of its own, on top of its parent, the test theme [theme-dev-test](https://github.com/saijsaij/theme-dev-test).

- Theme slug (directory name): `theme-dev-test-child`, parent theme (`Template:` in `style.css`): `theme-dev-test`
- Block namespace: `dev-test-child/`, REST namespace: `dev-test-child/v1`, PHP namespace `Saij\ThemeDevTestChild\`
- Requires WordPress 7.1 and PHP 8.5

A child theme with code is a framework instance of its own: `functions.php` boots it with `ChildTheme::boot()`, its release ships its own prefixed framework, and it reaches the parent theme only through the parent's public interface.

## Use of the parent theme and of the test plugin

- **Public API of the parent:** `Saij\ThemeDevTest\Api\DevTestApi`, injected with `#[ThemeApi] ?DevTestApi $parent = null` (`src/Parent/`).
- **Public template functions of the parent:** `theme_dev_test_badge(label)` and `theme_dev_test_partial(name)` in `src/Twig/ParentCalls.twig`, without declaring the parent.
- **Overrides:** `overrides/theme-dev-test/Twig/ChildOverridable.twig` overrides a template of the parent theme, `overrides/plugin-dev-test/Twig/Overridable.twig` one of the test plugin [plugin-dev-test](https://github.com/saijsaij/plugin-dev-test), before the parent theme's override.

## Development

The framework is required from its GitHub repository as `dev-main`, the parent theme as development dependency (`require-dev`, for static analysis; the release ZIP does not contain it). Clone the repositories side by side and develop with [wp-dev-env](https://github.com/saijsaij/wp-dev-env) with `WP_THEMES=theme-dev-test,theme-dev-test-child`, `WP_ACTIVE_THEME=theme-dev-test-child`, optionally `WP_PLUGINS=plugin-dev-test`, and `WP_PACKAGE_LINKS=saij/wp-app-framework=wp-app-framework,saij/theme-dev-test=theme-dev-test` (plus `saij/plugin-dev-test=plugin-dev-test` with the plugin); its setup runs `composer install`, `npm ci` and `npm run build` and activates the child theme.

```sh
git clone https://github.com/saijsaij/wp-app-framework.git
git clone https://github.com/saijsaij/theme-dev-test.git
git clone https://github.com/saijsaij/theme-dev-test-child.git
```

## Release

`composer release` builds `dist/theme-dev-test-child-<version>.zip` with the release pipeline of the framework (see [Release](https://saijsaij.github.io/wp-app-framework/next/build-and-release/release.html) in its documentation), without the parent theme; the framework comes from the lock file, or from the local checkout with `-- --package-source=saij/wp-app-framework=../wp-app-framework`. A tag `v<version>` (= `Version` in `style.css`) runs `.github/workflows/release.yml`: build, release test on top of the release of the parent theme named there (`with-theme`) with all browser tests, then the ZIP is attached to the GitHub release of the tag.

## Tests

All checks run with [wp-test-env](https://github.com/saijsaij/wp-test-env), checked out next to this repository, and must pass without errors or warnings. From this directory:

```sh
../wp-test-env/bin/tools -w theme-dev-test-child composer build-manifest
../wp-test-env/bin/tools -w theme-dev-test-child composer lint   # fix: composer fix
../wp-test-env/bin/tools -w theme-dev-test-child npm run lint    # fix: npm run format
```

`build-manifest` must report

```
Manifest OK (child theme theme-dev-test-child): 25 service candidates, 14 services, 1 hooks, 5 routes, 41 template functions, 0 template filters, 1 blocks, 0 CLI commands, 0 cron events, 0 cron tasks, 0 tables, 2 lifecycle methods. Nothing written (no --output).
Block markup OK: 1 templates, template parts and patterns checked.
Templates use the public template callables of: theme-dev-test.
Assets: 1 static files, 0 image variants.
```

The browser tests (Playwright, `tests/e2e/`) run in fresh WordPress instances of wp-test-env, described in `tests/dev.pools` (pool `tdtc`: the checkouts, this child theme active on `theme-dev-test`, with the test plugin) and `tests/release.pools` (pool `tdtc-release`: the release ZIP, built first with the framework checkout, on top of the release of the parent theme that `with-theme` in `.github/workflows/release.yml` names, downloaded by `tests/download-with-theme`, as in the release workflow). From the wp-test-env directory:

```sh
bin/run ../theme-dev-test-child/tests/dev.pools
bin/run ../theme-dev-test/tests/release.pools ../theme-dev-test-child/tests/release.pools
```

The tests need this child theme as active theme on top of `theme-dev-test` (`requireChildTheme()` fails otherwise); the test of the plugin override is skipped if the test plugin is not active. Each Playwright worker has an instance of its own (`WP_BASE_URLS`, picked per worker in `tests/e2e/playwright.config.js`). The console guard in `tests/e2e/fixtures.js` is the same as in the test theme.

| Spec | Covers | Code under test |
|---|---|---|
| `assets.spec.js` | Assets of the parent theme: the override of its logo in `overrides/theme-dev-test/assets/` (URL versioned by modification time, size of the override), an asset of the child theme's own `assets/` (`@child/…`) in an override of a parent template, assets it does not override | `overrides/theme-dev-test/assets/`, `overrides/theme-dev-test/Block/AssetShowcase/`, `assets/images/` |
| `block.spec.js` | Block of the child theme: inline editing, re-render through the child theme's render route, `registerPanel` of its instance, stored content, front end | `src/Block/Badge/` |
| `coexistence.spec.js` | Child and parent instance: separate runtimes, JS globals and render routes in one editor, blocks of both in one post, hooks of both | `src/Block/Badge/`, `src/Hook/` |
| `tests/lifecycle/run` of [theme-dev-test](https://github.com/saijsaij/theme-dev-test) | `#[OnActivation]` and `#[OnDeactivation]` of the child theme on switches to and from its parent theme | `src/Lifecycle/` |
| `parent.spec.js` | `#[ThemeApi]`, public template functions of the parent, templates with the same path in parent and child in one request | `src/Parent/`, `src/Twig/` |
| `twig.spec.js` | Own templates despite parent templates with the same path, overrides of parent and plugin templates, `@theme` of the parent, cache directories of child and parent (release: level for the overrides) | `src/Twig/`, `overrides/` |
| `styles.spec.js` | Stylesheet built with Tailwind without a prefix (the design of the parent theme): utilities of its templates and of its overrides of parent templates, loaded on the front end and in the editor canvas, not in the editor's main document | `assets/styles.css`, `src/Block/Badge/`, `overrides/theme-dev-test/` |
| `mode.spec.js` | Development and release mode, prefixed classes, init action `wp_app_framework/init/theme-dev-test-child`, paths of `ChildTheme` | `src/Mode/` |

## Structure

- `functions.php` loads the autoloader (`vendor-prefixed/` in release builds, `vendor/` in source checkouts) and boots the framework with `ChildTheme::boot()`.
- `src/` contains the child theme's PHP classes (PSR-4 `Saij\ThemeDevTestChild\`) with their Twig templates and editor scripts; they never override templates of the parent theme.
- `overrides/{slug}/` overrides templates of the parent theme and of plugins.
- `build/` (not versioned) is the output of the script and stylesheet build (`assets/styles.css`, Tailwind without a prefix, tokens on the variables of the parent theme's `theme.json`).

Caches: `wp-content/cache/theme-dev-test-child/manifest/` (development), `wp-content/cache/theme-dev-test-child/twig/<template version>/` (release).

## License

[GPL-2.0-or-later](LICENSE), like WordPress.
