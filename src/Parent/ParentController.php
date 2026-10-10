<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Parent;

use Saij\ThemeDevTest\Api\DevTestApi;
use Saij\ThemeDevTestChild\Rest\Api;
use Saij\WpAppFramework\Api\ThemeApi;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;

/**
 * Uses the public API of the parent theme (https://github.com/saijsaij/theme-dev-test).
 */
#[RestController(Api::NAMESPACE, base: '/parent')]
final readonly class ParentController
{
    public function __construct(
        #[ThemeApi]
        private ?DevTestApi $parent = null,
    ) {}

    /**
     * The block names of the parent theme's public API, or null if it provides none.
     *
     * @return list<string>|null
     */
    #[RestRoute('/api', HttpMethod::Get, new PublicAccess())]
    public function api(): ?array
    {
        return $this->parent?->getBlockNames();
    }
}
