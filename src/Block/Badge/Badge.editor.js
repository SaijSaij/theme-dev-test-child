/**
 * Editor extension of the badge block: a panel of the child theme's own framework instance.
 */
import { registerPanel } from '@webcodingcat/wp-app-framework';
import { PanelBody } from '@wordpress/components';

registerPanel( 'badge', ( { attributes } ) => (
	<PanelBody title="Badge summary" initialOpen={ false }>
		<p className="theme-dev-test-child-badge-summary">{ `Size: ${ attributes.size }` }</p>
	</PanelBody>
) );
