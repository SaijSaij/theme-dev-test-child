<?php

declare(strict_types=1);

namespace Saij\ThemeDevTestChild\Twig;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Saij\ThemeDevTestChild\Rest\Api;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;
use Saij\WpAppFramework\Twig\TemplateRenderer;
use SplFileInfo;

/**
 * Renders the child theme's templates through its renderer.
 */
#[RestController(Api::NAMESPACE, base: '/twig')]
final readonly class TwigController
{
    public function __construct(private TemplateRenderer $renderer) {}

    /**
     * Twig/Partial.twig of the child theme; the parent theme has a template with the same name.
     */
    #[RestRoute('/partial', HttpMethod::Get, new PublicAccess())]
    public function partial(string $name = 'World'): string
    {
        return $this->renderer->render('Twig/Partial.twig', ['name' => $name]);
    }

    /**
     * A template that calls the public template functions of the parent theme.
     */
    #[RestRoute('/parent-calls', HttpMethod::Get, new PublicAccess())]
    public function parentCalls(string $label = 'Tom & Jerry'): string
    {
        return $this->renderer->render('Twig/ParentCalls.twig', ['label' => $label]);
    }

    /**
     * Directories (relative) and compiled templates below the Twig cache of an instance: the child theme's
     * own or its parent theme's (which gets a level for the overrides of the child theme in a release).
     *
     * @return array{directory: string, directories: list<string>, compiled: int}
     */
    #[RestRoute('/cache', HttpMethod::Get, new PublicAccess())]
    public function cache(bool $parent = false): array
    {
        if (!$parent) {
            $this->renderer->render('Twig/Partial.twig', ['name' => 'cache']);
        }
        $directory = WP_CONTENT_DIR . '/cache/' . ($parent ? get_template() : get_stylesheet()) . '/twig';
        $directories = [];
        $compiled = 0;
        if (is_dir($directory)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST,
            );
            /** @var SplFileInfo $entry */
            foreach ($iterator as $entry) {
                if ($entry->isDir()) {
                    $directories[] = substr($entry->getPathname(), strlen($directory) + 1);
                } elseif ($entry->getExtension() === 'php') {
                    $compiled++;
                }
            }
            sort($directories);
        }

        return ['directory' => substr($directory, strlen(ABSPATH)), 'directories' => $directories, 'compiled' => $compiled];
    }
}
