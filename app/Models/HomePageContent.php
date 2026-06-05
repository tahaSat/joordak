<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomePageContent extends Model
{
    protected $fillable = [
        'hero_title',
        'hero_subtitle',
        'hero_image_url',
        'hero_button_text',
        'hero_button_link',
        'section_title',
        'section_subtitle',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
