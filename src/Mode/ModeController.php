<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Mode;

use Twig\Environment;
use WebCodingCat\ThemeDevTestChild\Rest\Api;
use WebCodingCat\WpAppFramework\ChildTheme;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

/**
 * Reports the mode and the paths of the child theme's framework instance.
 */
#[RestController(Api::VERSION)]
final readonly class ModeController
{
    public function __construct(private ChildTheme $childTheme) {}

    /**
     * Class names as the child theme's code sees them: prefixed in a release (Strauss rewrites the call sites).
     *
     * @return array{release: bool, devCache: bool, frameworkClass: string, twigClass: string, init: int, slug: string, parentSlug: string, directoryUri: string, parentDirectoryUri: string}
     */
    #[RestRoute('/mode', HttpMethod::Get, new PublicAccess())]
    public function mode(): array
    {
        return [
            'release' => is_file($this->childTheme->getDirectory() . '/' . ChildTheme::RELEASE_MANIFEST),
            'devCache' => is_dir(WP_CONTENT_DIR . '/cache/' . $this->childTheme->getSlug() . '/manifest'),
            'frameworkClass' => ChildTheme::class,
            'twigClass' => Environment::class,
            'init' => did_action('wp_app_framework/init/' . $this->childTheme->getSlug()),
            'slug' => $this->childTheme->getSlug(),
            'parentSlug' => $this->childTheme->getParentSlug(),
            'directoryUri' => $this->childTheme->getDirectoryUri(),
            'parentDirectoryUri' => $this->childTheme->getParentDirectoryUri(),
        ];
    }
}
