<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTestChild\Parent;

use WebCodingCat\ThemeDevTest\Api\DevTestApi;
use WebCodingCat\ThemeDevTestChild\Rest\Api;
use WebCodingCat\WpAppFramework\Api\ThemeApi;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

/**
 * Uses the public API of the parent theme (https://github.com/webcodingcat/theme-dev-test).
 */
#[RestController(Api::VERSION, base: '/parent')]
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
