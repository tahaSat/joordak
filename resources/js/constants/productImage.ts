export const PRODUCT_IMAGE_ASPECT_RATIO_WIDTH = 4;
export const PRODUCT_IMAGE_ASPECT_RATIO_HEIGHT = 5;

export const PRODUCT_IMAGE_ASPECT_CLASS = 'aspect-[4/5]';
export const PRODUCT_CARD_IMAGE_ASPECT_CLASS = 'aspect-[4/5]';

/** Intended storefront display size (matches PHP ProductImage::DISPLAY_*) */
export const PRODUCT_IMAGE_DISPLAY_WIDTH = 288;
export const PRODUCT_IMAGE_DISPLAY_HEIGHT = 360;

export const PRODUCT_SHOW_HERO_CLASS =
    'relative mx-auto min-w-0 w-full max-w-full overflow-hidden lg:mx-0 lg:w-[288px] xl:w-[320px]';
export const PRODUCT_SHOW_THUMBNAILS_CLASS =
    'flex min-w-0 gap-3 overflow-x-auto pb-2 lg:max-w-[288px] xl:max-w-[320px]';
export const PRODUCT_SHOW_IMAGE_CLASS = 'aspect-[4/5] w-full object-contain';

export const PRODUCT_IMAGE_UPLOAD_WIDTH = 576;
export const PRODUCT_IMAGE_UPLOAD_HEIGHT = 720;

export const PRODUCT_IMAGE_CROP_HINT = `تصویر قبل از آپلود با نسبت ${PRODUCT_IMAGE_ASPECT_RATIO_WIDTH}:${PRODUCT_IMAGE_ASPECT_RATIO_HEIGHT} و اندازه ${PRODUCT_IMAGE_UPLOAD_WIDTH}×${PRODUCT_IMAGE_UPLOAD_HEIGHT} برش داده می‌شود.`;

export const PRODUCT_IMAGE_GALLERY_CROP_HINT = `همه تصاویر گالری قبل از آپلود با نسبت ${PRODUCT_IMAGE_ASPECT_RATIO_WIDTH}:${PRODUCT_IMAGE_ASPECT_RATIO_HEIGHT} و اندازه ${PRODUCT_IMAGE_UPLOAD_WIDTH}×${PRODUCT_IMAGE_UPLOAD_HEIGHT} برش داده می‌شوند.`;
