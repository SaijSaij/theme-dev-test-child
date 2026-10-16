/**
 * The child theme's framework instance next to its parent's: separate
 * runtimes, render routes, hooks and blocks in the same post.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	blockCount,
	cleanUp,
	createDraft,
	openPostWith,
	requireChildTheme,
	THEME_RENDER_ROUTE,
	trackRenderRequests,
} = require( '../helpers' );

const POST = [
	block( 'dev-test/hero', { headline: 'Parent hero' } ),
	block( 'dev-test-child/badge', { label: 'Child badge' } ),
].join( '\n\n' );

test.describe( 'Child theme and parent theme', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'load separate runtimes and render their blocks through their own routes', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const childRenders = trackRenderRequests( page );
		const themeRenders = trackRenderRequests( page, THEME_RENDER_ROUTE );
		await openPostWith( { admin, editor, requestUtils }, POST );

		await expect(
			editor.canvas.locator(
				'[data-type="dev-test/hero"] .hero__headline'
			)
		).toHaveText( 'Parent hero' );
		await expect(
			editor.canvas.locator(
				'[data-type="dev-test-child/badge"] .badge__label'
			)
		).toHaveText( 'Child badge' );

		await expect.poll( () => childRenders.length ).toBe( 1 );
		await expect.poll( () => themeRenders.length ).toBe( 1 );
		expect(
			JSON.parse( childRenders[ 0 ].postData() ).blocks.map(
				( entry ) => entry.name
			)
		).toEqual( [ 'dev-test-child/badge' ] );
		expect( blockCount( themeRenders[ 0 ] ) ).toBe( 1 );

		const instances = await page.evaluate( () => ( {
			slugs: Object.keys( window.wpAppFramework ),
			childBlocks: Object.keys(
				window.wpAppFramework[ 'theme-dev-test-child' ].config.blocks
			),
		} ) );
		// The test plugin may be active as well.
		expect( instances.slugs ).toEqual(
			expect.arrayContaining( [
				'theme-dev-test',
				'theme-dev-test-child',
			] )
		);
		expect( instances.childBlocks ).toEqual( [ 'dev-test-child/badge' ] );
		await expect(
			page.locator( '#theme-dev-test-child-wp-app-framework-js' )
		).toHaveCount( 1 );
		await expect(
			page.locator( '#theme-dev-test-wp-app-framework-js' )
		).toHaveCount( 1 );
	} );

	test( 'render their blocks in the same post on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft( requestUtils, POST );

		await page.goto( `/?p=${ id }&preview=true` );

		await expect(
			page.locator( '.wp-block-dev-test-hero .hero__headline' )
		).toHaveText( 'Parent hero' );
		await expect(
			page.locator( '.wp-block-dev-test-child-badge .badge__label' )
		).toHaveText( 'Child badge' );
	} );

	test( 'run the hooks of both instances', async ( { page } ) => {
		const response = await page.request.get( '/' );
		const html = await response.text();

		expect( response.status() ).toBe( 200 );
		expect( html ).toContain(
			'<meta name="theme-dev-test-child-hook" content="Hello from theme-dev-test-child">'
		);
		expect( html ).toContain(
			'<meta name="dev-test-hook" content="Hello from a service">'
		);
	} );
} );
