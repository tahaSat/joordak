<x-filament::section heading="Current Banner Preview">
    <div class="relative h-[500px] overflow-hidden rounded-3xl">
        <img
            src="{{ $bannerUrl }}"
            alt="Current home banner"
            class="absolute inset-0 h-full w-full object-cover"
        />
        <div
            class="absolute inset-0"
            style="background-image: linear-gradient(120deg, rgba(169,186,201,0.45), rgba(169,186,201,0.25));"
        ></div>
    </div>
</x-filament::section>
