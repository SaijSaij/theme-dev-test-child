<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Block\Badge;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Block of the child theme, in its own block namespace next to the blocks of the parent theme.
 */
#[Block('badge', title: 'Badge', category: BlockCategory::Text, icon: 'awards', description: 'A badge from the test child theme.')]
final readonly class Badge
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(BadgeAttributes $attrs): string
    {
        return $this->renderer->render('Block/Badge/Badge.twig', ['attrs' => $attrs]);
    }
}
