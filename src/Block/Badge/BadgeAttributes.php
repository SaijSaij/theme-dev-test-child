<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Block\Badge;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class BadgeAttributes
{
    public function __construct(
        #[PlainText(excerpt: true)]
        public string $label = '',
        public Size $size = Size::Small,
    ) {}
}
