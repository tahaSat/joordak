<?php

namespace App\Filament\Support;

use App\Support\LiaraUrl;
use Filament\Forms\Components\BaseFileUpload;
use Filament\Forms\Components\FileUpload;
use Filament\Tables\Columns\ImageColumn;

class LiaraFileUpload
{
    public static function configure(FileUpload $upload): FileUpload
    {
        return $upload
            ->fetchFileInformation(false)
            ->getUploadedFileUsing(function (BaseFileUpload $component, string $file, string | array | null $storedFileNames): ?array {
                $url = LiaraUrl::fromPath($file);

                if (! $url) {
                    return null;
                }

                return [
                    'name' => ($component->isMultiple() ? ($storedFileNames[$file] ?? null) : $storedFileNames) ?? basename($file),
                    'size' => 0,
                    'type' => null,
                    'url' => $url,
                ];
            });
    }

    public static function imageColumn(ImageColumn $column): ImageColumn
    {
        return $column
            ->checkFileExistence(false)
            ->getStateUsing(function ($record) use ($column): ?string {
                $path = data_get($record, $column->getName());

                return LiaraUrl::fromPath(is_string($path) ? $path : null);
            });
    }
}
