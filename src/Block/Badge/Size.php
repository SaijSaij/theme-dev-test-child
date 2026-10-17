<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Block\Badge;

use WebCodingCat\WpAppFramework\Value\Labeled;

enum Size: string implements Labeled
{
    case Small = 'small';
    case Large = 'large';

    public function label(): string
    {
        return match ($this) {
            self::Small => 'Small',
            self::Large => 'Large',
        };
    }
}
