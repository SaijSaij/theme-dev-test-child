/**
 * The block of the child theme in the editor and on the front end.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	openPostWith,
	requireChildTheme,
	storedContent,
	trackRenderRequests,
} = require( '../helpers' );

test.describe( 'Child theme block', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'edits inline, re-renders through the route of the child theme and stores only the block comment', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test-child/badge', { label: 'New' } )
		);

		const badge = editor.canvas.locator(
			'[data-type="dev-test-child/badge"]'
		);
		await expect( badge ).toHaveClass( /badge--small/ );
		await expect.poll( () => renders.length ).toBe( 1 );

		await badge.locator( '.badge__label' ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' & shiny' );
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 1 );

		// A non-inline attribute re-renders once; the panel of the child theme's editor script reflects it.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'combobox', { name: 'Size' } )
			.selectOption( 'large' );
		await expect( badge ).toHaveClass( /badge--large/ );
		await expect.poll( () => renders.length ).toBe( 2 );
		await page.getByRole( 'button', { name: 'Badge summary' } ).click();
		await expect(
			page.locator( '.theme-dev-test-child-badge-summary' )
		).toHaveText( 'Size: large' );

		await editor.saveDraft();
		const content = await storedContent( requestUtils, id );
		const match = content.match(
			/^<!-- wp:dev-test-child\/badge (\{.*\}) \/-->$/
		);
		expect( match ).not.toBeNull();
		expect( JSON.parse( match[ 1 ] ) ).toEqual( {
			label: 'New & shiny',
			size: 'large',
		} );

		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( '.wp-block-dev-test-child-badge' );
		await expect( front ).toHaveClass( /badge--large/ );
		await expect( front.locator( '.badge__label' ) ).toHaveText(
			'New & shiny'
		);
		await expect( front.locator( '[data-field]' ) ).toHaveCount( 0 );
	} );
} );
