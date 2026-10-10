<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Block\Badge;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Block of the child theme, in its own block namespace next to the blocks of the parent theme.
 */
#[Block('dev-test-child/badge', title: 'Badge', category: BlockCategory::Text, icon: 'awards', description: 'A badge from the test child theme.')]
final readonly class Badge
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(BadgeAttributes $attrs): string
    {
        return $this->renderer->render('Block/Badge/Badge.twig', ['attrs' => $attrs]);
    }
}
