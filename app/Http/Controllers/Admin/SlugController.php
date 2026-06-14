<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\SlugGenerator;
use Illuminate\Http\Request;

class SlugController extends Controller
{
    /**
     * @return array{slug: string}
     */
    public function __invoke(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        return ['slug' => SlugGenerator::fromTitle($data['title'])];
    }
}
