/**
 * The child theme's stylesheet src/styles.css, compiled with Tailwind without a
 * prefix (the child theme shares the design of its parent theme), loaded on the
 * front end and in the editor canvas.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createDraft,
	openPostWith,
	requireChildTheme,
} = require( '../helpers' );

const STYLESHEET = '#theme-dev-test-child-styles-css';

/**
 * Expects the computed styles of Tailwind's own values in Badge.twig (the colors
 * depend on the theme.json of the parent theme release the suite runs with).
 *
 * @param {import('@playwright/test').Locator} badge
 */
async function expectStyled( badge ) {
	await expect( badge ).toHaveCSS( 'padding-left', '12px' );
	await expect( badge ).toHaveCSS( 'border-top-left-radius', '8px' );
}

test.describe( 'Child theme stylesheet', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'contains the utilities of its templates and of its overrides of parent templates', async ( {
		request,
	} ) => {
		const response = await request.get(
			'/wp-content/themes/theme-dev-test-child/build/styles.css'
		);
		expect( response.status() ).toBe( 200 );
		const css = await response.text();

		const classes = [ ...css.matchAll( /\.([a-z][\w-]*)\{/g ) ].map(
			( match ) => match[ 1 ]
		);
		expect( classes.sort() ).toEqual( [
			'bg-primary',
			'px-3',
			'rounded-lg',
			// Only used in overrides/theme-dev-test/.
			'underline',
		] );
		// The same token as in the parent theme.
		expect( css ).toContain(
			'.bg-primary{background-color:var(--wp--preset--color--primary)}'
		);
	} );

	test( 'styles the block on the front end and in the editor canvas', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			block( 'dev-test-child/badge', { label: 'New' } )
		);
		await page.goto( `/?p=${ id }&preview=true` );
		await expect( page.locator( STYLESHEET ) ).toHaveCount( 1 );
		await expectStyled( page.locator( '.wp-block-dev-test-child-badge' ) );

		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test-child/badge', { label: 'New' } )
		);
		const badge = editor.canvas.locator(
			'[data-type="dev-test-child/badge"]'
		);
		await expect( badge ).toHaveText( 'New' );
		await expect( editor.canvas.locator( STYLESHEET ) ).toHaveCount( 1 );
		await expect( page.locator( STYLESHEET ) ).toHaveCount( 0 );
		await expectStyled( badge );
	} );
} );
