/**
 * Editor extension of the badge block: a panel of the child theme's own framework instance.
 */
import { registerPanel } from '@saij/wp-app-framework';
import { PanelBody } from '@wordpress/components';

registerPanel( 'dev-test-child/badge', ( { attributes } ) => (
	<PanelBody title="Badge summary" initialOpen={ false }>
		<p className="theme-dev-test-child-badge-summary">{ `Size: ${ attributes.size }` }</p>
	</PanelBody>
) );
