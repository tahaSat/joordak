<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Filament\Support\LiaraFileUpload;
use App\Support\ProductImage;
use App\Support\SlugGenerator;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->searchable()
                    ->preload(),
                TextInput::make('title')
                    ->required(),
                TextInput::make('slug')
                    ->required()
                    ->suffixAction(
                        Action::make('generateSlug')
                            ->label('Generate')
                            ->icon(Heroicon::ArrowPath)
                            ->tooltip('Generate Persian slug from title')
                            ->action(function (Get $get, Set $set): void {
                                $title = $get('title');

                                if (blank($title)) {
                                    Notification::make()
                                        ->title('Enter a title first')
                                        ->warning()
                                        ->send();

                                    return;
                                }

                                $set('slug', SlugGenerator::fromTitle($title));
                            }),
                    ),
                TextInput::make('excerpt')
                    ->belowLabel('توضیحات کوتاه برای نمایش در حالت لیست'),
                Textarea::make('description')
                    ->belowLabel('توضیحات بیشتر محصول برای محتوای داخل صفحه ی محصول')
                    ->columnSpanFull(),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('ریال'),
                TextInput::make('stock')
                    ->required()
                    ->numeric()
                    ->default(0),
                LiaraFileUpload::configure(
                    FileUpload::make('image_url')
                        ->label('Cover image')
                        ->image()
                        ->imageEditor()
                        ->imageAspectRatio(ProductImage::ASPECT_RATIO)
                        ->automaticallyCropImagesToAspectRatio()
                        ->automaticallyOpenImageEditorForAspectRatio()
                        ->automaticallyResizeImagesMode('cover')
                        ->automaticallyResizeImagesToWidth((string) ProductImage::UPLOAD_WIDTH)
                        ->automaticallyResizeImagesToHeight((string) ProductImage::UPLOAD_HEIGHT)
                        ->disk('liara')
                        ->directory('products')
                        ->visibility('public'),
                ),
                LiaraFileUpload::configure(
                    FileUpload::make('photo_urls')
                        ->label('Gallery images')
                        ->multiple()
                        ->image()
                        ->imageEditor()
                        ->imageAspectRatio(ProductImage::ASPECT_RATIO)
                        ->automaticallyCropImagesToAspectRatio()
                        ->automaticallyResizeImagesMode('cover')
                        ->automaticallyResizeImagesToWidth((string) ProductImage::UPLOAD_WIDTH)
                        ->automaticallyResizeImagesToHeight((string) ProductImage::UPLOAD_HEIGHT)
                        ->reorderable()
                        ->disk('liara')
                        ->directory('products/gallery')
                        ->visibility('public')
                        ->columnSpanFull(),
                ),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
