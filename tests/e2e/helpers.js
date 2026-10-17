const { request: apiRequest } = require( '@playwright/test' );

/** Render routes of the framework instances of the child theme and of its parent theme. */
const RENDER_ROUTE = '/wp-app-framework/v1/theme-dev-test-child/render';
const THEME_RENDER_ROUTE = '/wp-app-framework/v1/theme-dev-test/render';

/** The child theme and its parent, the test theme (https://github.com/webcodingcat/theme-dev-test). */
const CHILD_THEME = 'theme-dev-test-child';
const PARENT_THEME = 'theme-dev-test';

/** The tests run against the release ZIP (E2E_TARGET=release, checked in playwright.config.js). */
const IS_RELEASE = process.env.E2E_TARGET === 'release';

/** Namespace prefix of the dependencies in a release (extra.strauss.namespace_prefix in composer.json). */
const VENDOR_PREFIX = IS_RELEASE ? 'Saij\\ThemeDevTestChild\\Vendor\\' : '';

/** Posts created by the tests; cleanUp() removes exactly these. */
const createdPosts = [];

/**
 * Records the requests of an editor runtime to its render route.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          [route] Render route; the child theme's by default.
 * @return {import('@playwright/test').Request[]} Requests, filled while the page runs.
 */
function trackRenderRequests( page, route = RENDER_ROUTE ) {
	const requests = [];
	page.on( 'request', ( request ) => {
		if ( decodeURIComponent( request.url() ).includes( route ) ) {
			requests.push( request );
		}
	} );
	return requests;
}

/**
 * Fails unless the child theme is active on top of the test theme: all tests need both.
 *
 * @param {Object} requestUtils
 */
async function requireChildTheme( requestUtils ) {
	const themes = await requestUtils.rest( {
		path: '/wp/v2/themes',
		params: { status: 'active' },
	} );
	const active = themes.map(
		( theme ) => `${ theme.stylesheet } (parent ${ theme.template })`
	);
	if (
		themes.length !== 1 ||
		themes[ 0 ].stylesheet !== CHILD_THEME ||
		themes[ 0 ].template !== PARENT_THEME
	) {
		throw new Error(
			`These tests need the active theme ${ CHILD_THEME } with the parent ${ PARENT_THEME }, found ${ active.join( ', ' ) }.`
		);
	}
}

/**
 * Whether the test plugin (https://github.com/webcodingcat/plugin-dev-test) is installed and active.
 *
 * @param {Object} requestUtils
 * @return {Promise<boolean>} Active.
 */
async function pluginActive( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/wp/v2/plugins/plugin-dev-test/plugin-dev-test',
	} );
	if ( response.status === 404 ) {
		return false;
	}
	if ( response.status !== 200 ) {
		throw new Error(
			`Cannot read the status of plugin-dev-test: HTTP ${ response.status }.`
		);
	}
	return response.body.status === 'active';
}

/**
 * Whether the parent theme has static assets: theme-dev-test registers its block dev-test/asset-showcase since 0.13.
 * The release workflow of the framework runs this suite on an older theme release.
 *
 * @param {Object} requestUtils
 * @return {Promise<boolean>} The parent theme has assets.
 */
async function parentHasAssets( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/wp/v2/block-types/dev-test/asset-showcase',
	} );
	return response.status === 200;
}

/**
 * Number of blocks a render request asked for.
 *
 * @param {import('@playwright/test').Request} request
 * @return {number} Blocks.
 */
function blockCount( request ) {
	return JSON.parse( request.postData() ).blocks.length;
}

/**
 * Serialized block comment of a block with attributes.
 *
 * @param {string} name
 * @param {Object} attributes
 * @param {string} [inner]    Serialized inner blocks.
 * @return {string} Block markup.
 */
function block( name, attributes = {}, inner ) {
	const json = Object.keys( attributes ).length
		? ` ${ JSON.stringify( attributes ) }`
		: '';
	return inner === undefined
		? `<!-- wp:${ name }${ json } /-->`
		: `<!-- wp:${ name }${ json } -->\n${ inner }\n<!-- /wp:${ name } -->`;
}

/**
 * Creates a draft with the given content and opens it in the block editor.
 *
 * @param {Object} fixtures              Playwright fixtures.
 * @param {Object} fixtures.admin        Admin utilities.
 * @param {Object} fixtures.editor       Editor utilities.
 * @param {Object} fixtures.requestUtils REST utilities.
 * @param {string} content               Serialized blocks.
 * @return {Promise<number>} Post ID.
 */
async function openPostWith( { admin, editor, requestUtils }, content ) {
	const id = await createDraft( requestUtils, content );
	await admin.visitAdminPage( 'post.php', `post=${ id }&action=edit` );
	await editor.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		fullscreenMode: false,
	} );
	return id;
}

/**
 * Creates a draft with the given content (the admin can view it with
 * `/?p=<id>&preview=true`).
 *
 * @param {Object} requestUtils
 * @param {string} content      Serialized blocks.
 * @return {Promise<number>} Post ID.
 */
async function createDraft( requestUtils, content ) {
	return createPost( requestUtils, {
		title: 'E2E',
		content,
		status: 'draft',
	} );
}

/**
 * Creates a post; cleanUp() deletes it.
 *
 * @param {Object} requestUtils
 * @param {Object} post         Fields of the post: title, content, status.
 * @return {Promise<number>} Post ID.
 */
async function createPost( requestUtils, post ) {
	const created = await requestUtils.createPost( post );
	createdPosts.push( created.id );
	return created.id;
}

/**
 * Calls the REST API and returns the response whatever its status.
 *
 * @param {Object}        requestUtils
 * @param {Object}        options
 * @param {string}        options.path     Route, e.g. "/dev-test/v1/items".
 * @param {string}        [options.method] HTTP method.
 * @param {Object}        [options.params] Query arguments.
 * @param {Object}        [options.data]   JSON body.
 * @param {string|Object} [options.as]     "admin" (default, logged-in session), "anonymous" or credentials ({username, password}) for HTTP Basic authentication.
 * @return {Promise<{status: number, headers: Object<string, string>, body: (Object|Array|string|number|boolean|null)}>} Status, headers and the decoded JSON body (null if empty).
 */
async function restResponse(
	requestUtils,
	{ path: route, method = 'GET', params, data, as = 'admin' }
) {
	if ( ! requestUtils.storageState?.nonce ) {
		await requestUtils.setupRest();
	}
	const url = requestUtils.storageState.rootURL + route.replace( /^\//, '' );
	const options = { method, params, data, failOnStatusCode: false };
	if ( as === 'admin' ) {
		return decode(
			await requestUtils.request.fetch( url, {
				...options,
				headers: { 'X-WP-Nonce': requestUtils.storageState.nonce },
			} )
		);
	}
	// A fresh context; inside the test runner it would inherit the admin's session (storageState of
	// the config), whose cookie WordPress prefers over Basic authentication. Credentials are sent
	// without waiting for a challenge.
	const context = await apiRequest.newContext( {
		storageState: { cookies: [], origins: [] },
		...( as === 'anonymous'
			? {}
			: { httpCredentials: { ...as, send: 'always' } } ),
	} );
	try {
		return decode( await context.fetch( url, options ) );
	} finally {
		await context.dispose();
	}
}

/**
 * @param {import('@playwright/test').APIResponse} response
 * @return {Promise<{status: number, headers: Object<string, string>, body: (Object|Array|string|number|boolean|null)}>} Decoded response.
 */
async function decode( response ) {
	const text = await response.text();
	return {
		status: response.status(),
		headers: response.headers(),
		body: text === '' ? null : JSON.parse( text ),
	};
}

/**
 * The raw content of a post as stored.
 *
 * @param {Object} requestUtils
 * @param {number} id
 * @return {Promise<string>} post_content.
 */
async function storedContent( requestUtils, id ) {
	const post = await requestUtils.rest( {
		path: `/wp/v2/posts/${ id }`,
		params: { context: 'edit' },
	} );
	return post.content.raw;
}

/**
 * Deletes the posts the tests created, and nothing else.
 *
 * @param {Object} requestUtils
 */
async function cleanUp( requestUtils ) {
	while ( createdPosts.length > 0 ) {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/posts/${ createdPosts.pop() }`,
			params: { force: true },
		} );
	}
}

module.exports = {
	parentHasAssets,
	block,
	blockCount,
	cleanUp,
	createDraft,
	createPost,
	IS_RELEASE,
	openPostWith,
	pluginActive,
	RENDER_ROUTE,
	requireChildTheme,
	restResponse,
	THEME_RENDER_ROUTE,
	storedContent,
	trackRenderRequests,
	VENDOR_PREFIX,
};
