<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Block\Badge;

use Saij\WpAppFramework\Value\PlainText;

final readonly class BadgeAttributes
{
    public function __construct(
        #[PlainText(excerpt: true)]
        public string $label = '',
        public Size $size = Size::Small,
    ) {}
}
