<?php

namespace App\Filament\Pages;

use App\Filament\Support\LiaraFileUpload;
use App\Http\Controllers\HomeBannerController;
use App\Models\Setting;
use App\Support\HeroBannerImage;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\View;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class HomeBanner extends Page
{
    protected static BackedEnum|string|null $navigationIcon = Heroicon::OutlinedPhoto;

    protected static ?string $navigationLabel = 'Home Banner';

    protected static ?int $navigationSort = 1;

    protected static ?string $title = 'Home Banner';

    /**
     * @var array<string, mixed>|null
     */
    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'banner' => Setting::getValue('home_banner_path'),
        ]);
    }

    public function defaultForm(Schema $schema): Schema
    {
        return $schema
            ->statePath('data');
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Hero Banner')
                    ->description('Crop the image to match the home page hero section ('.HeroBannerImage::DISPLAY_WIDTH.'×'.HeroBannerImage::DISPLAY_HEIGHT.'px).')
                    ->schema([
                        LiaraFileUpload::configure(
                            FileUpload::make('banner')
                                ->label('Banner image')
                                ->image()
                                ->imageEditor()
                                ->imageAspectRatio(HeroBannerImage::ASPECT_RATIO)
                                ->automaticallyCropImagesToAspectRatio()
                                ->automaticallyOpenImageEditorForAspectRatio()
                                ->automaticallyResizeImagesMode('cover')
                                ->automaticallyResizeImagesToWidth((string) HeroBannerImage::UPLOAD_WIDTH)
                                ->automaticallyResizeImagesToHeight((string) HeroBannerImage::UPLOAD_HEIGHT)
                                ->imageEditorViewportWidth(HeroBannerImage::DISPLAY_WIDTH)
                                ->imageEditorViewportHeight(HeroBannerImage::DISPLAY_HEIGHT)
                                ->disk('liara')
                                ->directory('banners')
                                ->visibility('public')
                                ->maxSize(5120),
                        ),
                    ]),
            ]);
    }

    public function save(): void
    {
        $data = $this->form->getState();

        Setting::setValue('home_banner_path', $data['banner'] ?? null);

        Notification::make()
            ->title('Banner saved successfully.')
            ->success()
            ->send();
    }

    /**
     * @return array<Action>
     */
    protected function getFormActions(): array
    {
        return [
            Action::make('save')
                ->label('Save Banner')
                ->submit('save')
                ->keyBindings(['mod+s']),
        ];
    }

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getFormContentComponent(),
                View::make('filament.pages.home-banner-preview')
                    ->viewData(fn (): array => [
                        'bannerUrl' => $this->getBannerPreviewUrl(),
                    ])
                    ->visible(fn (): bool => filled($this->getBannerPreviewUrl())),
            ]);
    }

    public function getFormContentComponent(): Component
    {
        return Form::make([EmbeddedSchema::make('form')])
            ->id('form')
            ->livewireSubmitHandler('save')
            ->footer([
                Actions::make($this->getFormActions())
                    ->alignment($this->getFormActionsAlignment())
                    ->key('form-actions'),
            ]);
    }

    protected function getBannerPreviewUrl(): ?string
    {
        $path = Setting::getValue('home_banner_path');

        if (! $path) {
            return null;
        }

        return app(HomeBannerController::class)->publicUrl($path);
    }
}
