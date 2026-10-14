/**
 * Step 26: static assets of the parent theme from the child theme's view – an
 * override of a parent asset (overrides/theme-dev-test/assets/) and an asset of
 * the child theme's own assets/ directory (@child/…).
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createPost,
	parentHasAssets,
	requireChildTheme,
} = require( '../helpers' );

const CHILD = '/wp-content/themes/theme-dev-test-child/';

test.describe( 'Assets of the parent theme', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
		test.skip(
			! ( await parentHasAssets( requestUtils ) ),
			'The parent theme release has no static assets (theme-dev-test before 0.13).'
		);
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'are overridden and complemented by the child theme', async ( {
		page,
		request,
		requestUtils,
	} ) => {
		const id = await createPost( requestUtils, {
			title: 'E2E child assets',
			content: block( 'dev-test/asset-showcase' ),
			status: 'publish',
		} );
		await page.goto( `/?p=${ id }` );

		// The override replaces the parent's logo, with its own size, versioned by its modification time.
		const logo = page.locator( '.asset-showcase__logo' );
		const logoSrc = await logo.getAttribute( 'src' );
		expect( new URL( logoSrc ).pathname ).toBe(
			`${ CHILD }overrides/theme-dev-test/assets/images/logo.svg`
		);
		expect( new URL( logoSrc ).searchParams.get( 'ver' ) ).toMatch(
			/^\d+$/
		);
		await expect( logo ).toHaveAttribute( 'width', '80' );
		expect( ( await request.get( logoSrc ) ).status() ).toBe( 200 );

		// An asset of the child theme's own directory, in its override of a parent template.
		const team = page.locator( '.asset-showcase__child' );
		const teamSrc = await team.getAttribute( 'src' );
		expect( new URL( teamSrc ).pathname ).toBe(
			`${ CHILD }assets/images/team.svg`
		);
		await expect( team ).toHaveAttribute( 'width', '60' );
		await expect( team ).toHaveAttribute( 'height', '30' );
		expect( ( await request.get( teamSrc ) ).status() ).toBe( 200 );

		// Assets the child theme does not override stay the parent's.
		expect(
			await page.locator( '.asset-showcase__image' ).getAttribute( 'src' )
		).toContain( '/themes/theme-dev-test/assets/images/swatch.png?ver=' );
	} );
} );
