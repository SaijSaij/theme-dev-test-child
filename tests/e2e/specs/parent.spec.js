/**
 * The child theme as consumer of its parent theme: its public API
 * (#[ThemeApi]) and its public template functions, without declaring them.
 */
const { test, expect } = require( '../fixtures' );

const { requireChildTheme, restResponse } = require( '../helpers' );

async function get( requestUtils, path ) {
	const response = await restResponse( requestUtils, {
		path,
		as: 'anonymous',
	} );
	expect( response.status ).toBe( 200 );
	return response.body;
}

test.describe( 'Parent theme', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test( 'provides its public API', async ( { requestUtils } ) => {
		expect(
			await get( requestUtils, '/dev-test-child/v1/parent/api' )
		).toEqual( [
			'dev-test/hero',
			'dev-test/section',
			'dev-test/paragraph',
		] );
	} );

	test( 'offers its template functions to the templates of the child theme', async ( {
		requestUtils,
	} ) => {
		const html = (
			await get( requestUtils, '/dev-test-child/v1/twig/parent-calls' )
		).replace( /\s*\n\s*/g, '' );

		// Twig/Partial.twig of the parent and of the child in the same request stay separate;
		// the HTML function escapes its argument.
		expect( html ).toBe(
			[
				'<p class="badge"><span class="badge badge--theme">Tom &amp; Jerry</span></p>',
				'<div class="partial"><p class="partial">theme</p></div>',
				'<p class="partial partial--child">child</p>',
			].join( '' )
		);
	} );
} );
