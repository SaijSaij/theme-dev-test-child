<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Block\Badge;

use Saij\WpAppFramework\Block\Labeled;

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
