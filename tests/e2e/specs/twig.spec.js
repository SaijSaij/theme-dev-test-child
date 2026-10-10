/**
 * Templates of the child theme's instance and its overrides of the templates
 * of the parent theme (overrides/theme-dev-test/) and of the test plugin
 * (overrides/plugin-dev-test/, before the parent theme's override).
 */
const { test, expect } = require( '../fixtures' );

const {
	IS_RELEASE,
	pluginActive,
	requireChildTheme,
	restResponse,
} = require( '../helpers' );

async function get( requestUtils, path, params ) {
	const response = await restResponse( requestUtils, {
		path,
		params,
		as: 'anonymous',
	} );
	expect( response.status ).toBe( 200 );
	return response.body;
}

/**
 * The Twig cache directories (relative) must be twig/{templateVersion}/ with Twig's hash directories in
 * a release, optionally below a level for the theme versions; Twig's hash directories in development mode.
 *
 * @param {string[]} directories
 * @param {boolean}  overrides   The release cache has a level for overrides of a theme.
 */
function expectCacheLayout( directories, overrides ) {
	if ( ! IS_RELEASE ) {
		for ( const directory of directories ) {
			expect( directory ).toMatch( /^[0-9a-f]{2}$/ );
		}
		return;
	}
	const [ version, ...rest ] = directories;
	expect( version ).toMatch( /^[0-9a-f]{16}$/ );
	expect( rest.length ).toBeGreaterThan( 0 );
	const below = overrides
		? `${ version }/[0-9a-f]{16}(?:/[0-9a-f]{2})?`
		: `${ version }/[0-9a-f]{2}`;
	for ( const directory of rest ) {
		expect( directory ).toMatch( new RegExp( `^${ below }$` ) );
	}
}

test.describe( 'Child theme templates', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test( 'renders its own template although the parent theme has one with the same name', async ( {
		requestUtils,
	} ) => {
		expect(
			await get( requestUtils, '/dev-test-child/v1/twig/partial' )
		).toBe( '<p class="partial partial--child">World</p>\n' );
		// src/ of the child theme does not override the parent theme's template.
		expect(
			( await get( requestUtils, '/dev-test/v1/twig/plain' ) ).html
		).toBe( '<p class="partial">World</p>\n' );
	} );

	test( 'overrides a template of the parent theme in overrides/theme-dev-test/', async ( {
		requestUtils,
	} ) => {
		expect(
			await get( requestUtils, '/dev-test/v1/twig/child-overridable' )
		).toBe(
			'<p class="overridable">overridden by theme-dev-test-child</p>\n'
		);
		// @theme addresses the parent theme's own template.
		expect(
			await get(
				requestUtils,
				'/dev-test/v1/twig/child-overridable-exact'
			)
		).toBe( '<p class="overridable">from theme-dev-test</p>\n' );
	} );

	test( 'overrides a template of the test plugin before the parent theme', async ( {
		requestUtils,
	} ) => {
		test.skip(
			! ( await pluginActive( requestUtils ) ),
			'plugin-dev-test is not active (release test of the child theme alone).'
		);
		expect(
			await get( requestUtils, '/plugin-dev-test/v1/twig/overridable' )
		).toBe(
			'<p class="overridable">overridden by theme-dev-test-child</p>\n'
		);
	} );

	test(
		IS_RELEASE
			? 'caches compiled templates per release, the parent theme below a level for the overrides'
			: 'caches compiled templates below the slugs of child and parent theme',
		async ( { requestUtils } ) => {
			const own = await get(
				requestUtils,
				'/dev-test-child/v1/twig/cache'
			);
			expect( own.directory ).toBe(
				'wp-content/cache/theme-dev-test-child/twig'
			);
			expect( own.compiled ).toBeGreaterThan( 0 );
			expectCacheLayout( own.directories, false );

			// Compiles the override of the child theme in the parent theme's cache.
			await get( requestUtils, '/dev-test/v1/twig/child-overridable' );
			const parent = await get(
				requestUtils,
				'/dev-test-child/v1/twig/cache',
				{ parent: true }
			);
			expect( parent.directory ).toBe(
				'wp-content/cache/theme-dev-test/twig'
			);
			expect( parent.compiled ).toBeGreaterThan( 0 );
			expectCacheLayout( parent.directories, true );
		}
	);
} );
