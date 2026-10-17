<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Hook;

use WebCodingCat\WpAppFramework\ChildTheme;
use WebCodingCat\WpAppFramework\Hook\Hook;

/**
 * Action of the child theme: prints a meta tag the browser tests look for.
 */
final readonly class HeadMarker
{
    public function __construct(private ChildTheme $childTheme) {}

    #[Hook('wp_head')]
    public function print(): void
    {
        printf('<meta name="theme-dev-test-child-hook" content="%s">' . "\n", esc_attr('Hello from ' . $this->childTheme->getSlug()));
    }
}
