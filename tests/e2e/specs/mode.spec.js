/**
 * Development mode with the checkout, release mode with the release ZIP
 * (E2E_TARGET=release, an instance of wp-test-env in release mode with the child theme ZIP).
 */
const { test, expect } = require( '../fixtures' );

const {
	IS_RELEASE,
	requireChildTheme,
	restResponse,
	VENDOR_PREFIX,
} = require( '../helpers' );

test.describe( 'Mode', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requireChildTheme( requestUtils );
	} );

	test(
		IS_RELEASE
			? 'runs from the built manifest with prefixed dependencies'
			: 'runs from the source checkout in development mode',
		async ( { baseURL, requestUtils } ) => {
			const response = await restResponse( requestUtils, {
				path: '/dev-test-child/v1/mode',
				as: 'anonymous',
			} );
			expect( response.status ).toBe( 200 );
			expect( response.body ).toEqual( {
				release: IS_RELEASE,
				devCache: ! IS_RELEASE,
				frameworkClass: `${ VENDOR_PREFIX }WebCodingCat\\WpAppFramework\\ChildTheme`,
				twigClass: `${ VENDOR_PREFIX }Twig\\Environment`,
				// wp_app_framework/init/theme-dev-test-child fired once.
				init: 1,
				slug: 'theme-dev-test-child',
				parentSlug: 'theme-dev-test',
				directoryUri: `${ baseURL }/wp-content/themes/theme-dev-test-child`,
				parentDirectoryUri: `${ baseURL }/wp-content/themes/theme-dev-test`,
			} );
		}
	);
} );
