<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Rest;

use Saij\WpAppFramework\DependencyInjection\NoService;

#[NoService]
final class Api
{
    public const string NAMESPACE = 'dev-test-child/v1';
}
