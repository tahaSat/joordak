import Modal from '@/Components/Modal';
import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

export interface CropResult {
    file: File;
    previewUrl: string;
}

interface ImageCropperModalProps {
    file: File | null;
    title: string;
    description: string;
    outputWidth: number;
    outputHeight: number;
    fallbackName: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isProcessing?: boolean;
    onCancel: () => void;
    onConfirm: (result: CropResult) => void;
}

const minZoom = 1;
const maxZoom = 3;
const defaultCropPosition = 50;

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('امکان خواندن تصویر وجود ندارد.'));
        image.src = url;
    });
}

async function cropImage(
    file: File,
    imageUrl: string,
    outputWidth: number,
    outputHeight: number,
    positionX: number,
    positionY: number,
    zoom: number,
    fallbackName: string,
): Promise<CropResult> {
    const image = await loadImageFromUrl(imageUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('امکان برش تصویر وجود ندارد.');
    }

    const targetRatio = outputWidth / outputHeight;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const coverWidth = imageRatio > targetRatio ? outputHeight * imageRatio : outputWidth;
    const coverHeight = imageRatio > targetRatio ? outputHeight : outputWidth / imageRatio;
    const scaledWidth = coverWidth * zoom;
    const scaledHeight = coverHeight * zoom;
    const extraX = scaledWidth - outputWidth;
    const extraY = scaledHeight - outputHeight;
    const offsetX = extraX * (positionX / 100);
    const offsetY = extraY * (positionY / 100);

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(image, -offsetX, -offsetY, scaledWidth, scaledHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) {
                resolve(result);
                return;
            }

            reject(new Error('امکان برش تصویر وجود ندارد.'));
        }, 'image/jpeg', 0.9);
    });
    const baseName = file.name.replace(/\.[^.]+$/, '') || fallbackName;
    const croppedFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(blob);

    return { file: croppedFile, previewUrl };
}

export default function ImageCropperModal({
    file,
    title,
    description,
    outputWidth,
    outputHeight,
    fallbackName,
    confirmLabel = 'تایید و آپلود',
    cancelLabel = 'انصراف',
    isProcessing = false,
    onCancel,
    onConfirm,
}: ImageCropperModalProps) {
    const [positionX, setPositionX] = useState(defaultCropPosition);
    const [positionY, setPositionY] = useState(defaultCropPosition);
    const [zoom, setZoom] = useState(minZoom);
    const [cropError, setCropError] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [imageRatio, setImageRatio] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{
        pointerId: number;
        clientX: number;
        clientY: number;
        positionX: number;
        positionY: number;
    } | null>(null);
    const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    const aspectRatio = outputWidth / outputHeight;
    const isPortraitCrop = outputHeight > outputWidth;
    const targetRatio = outputWidth / outputHeight;
    const coverWidth = imageRatio && imageRatio > targetRatio ? outputHeight * imageRatio : outputWidth;
    const coverHeight = imageRatio && imageRatio > targetRatio ? outputHeight : outputWidth / (imageRatio ?? targetRatio);
    const scaledWidth = coverWidth * zoom;
    const scaledHeight = coverHeight * zoom;
    const offsetX = (scaledWidth - outputWidth) * (positionX / 100);
    const offsetY = (scaledHeight - outputHeight) * (positionY / 100);
    const isBusy = isProcessing || isCropping;

    useEffect(() => {
        setPositionX(defaultCropPosition);
        setPositionY(defaultCropPosition);
        setZoom(minZoom);
        setCropError(null);
        setImageRatio(null);
        setIsDragging(false);
        dragStartRef.current = null;
    }, [file]);

    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    useEffect(() => {
        let isCurrent = true;

        if (!imageUrl) {
            return () => {
                isCurrent = false;
            };
        }

        loadImageFromUrl(imageUrl)
            .then((image) => {
                if (isCurrent) {
                    setImageRatio(image.naturalWidth / image.naturalHeight);
                }
            })
            .catch((error: unknown) => {
                if (isCurrent) {
                    setCropError(error instanceof Error ? error.message : 'امکان خواندن تصویر وجود ندارد.');
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [imageUrl]);

    async function confirmCrop() {
        if (!file || !imageUrl) {
            return;
        }

        setIsCropping(true);
        setCropError(null);
        try {
            onConfirm(await cropImage(file, imageUrl, outputWidth, outputHeight, positionX, positionY, zoom, fallbackName));
        } catch (error) {
            setCropError(error instanceof Error ? error.message : 'برش تصویر ناموفق بود.');
        } finally {
            setIsCropping(false);
        }
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        if (isBusy || !imageRatio) {
            return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
        dragStartRef.current = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            positionX,
            positionY,
        };
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        const dragStart = dragStartRef.current;

        if (!dragStart || dragStart.pointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();

        const previewWidth = event.currentTarget.clientWidth;
        const previewHeight = event.currentTarget.clientHeight;
        const extraX = previewWidth * ((scaledWidth - outputWidth) / outputWidth);
        const extraY = previewHeight * ((scaledHeight - outputHeight) / outputHeight);
        const deltaX = event.clientX - dragStart.clientX;
        const deltaY = event.clientY - dragStart.clientY;

        if (extraX > 0) {
            setPositionX(clamp(dragStart.positionX - (deltaX / extraX) * 100, 0, 100));
        }

        if (extraY > 0) {
            setPositionY(clamp(dragStart.positionY - (deltaY / extraY) * 100, 0, 100));
        }
    }

    function stopDragging(event: PointerEvent<HTMLDivElement>) {
        if (dragStartRef.current?.pointerId === event.pointerId) {
            dragStartRef.current = null;
            setIsDragging(false);
        }
    }

    return (
        <Modal show={Boolean(file)} onClose={isBusy ? () => {} : onCancel} closeable={!isBusy} maxWidth="2xl">
            <div className="space-y-5 p-5 text-right" dir="rtl">
                <div>
                    <h2 className="text-lg font-black text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
                </div>

                {imageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-3">
                        <div className={isPortraitCrop ? 'flex justify-center' : undefined}>
                            <div
                                className={`relative touch-none overflow-hidden rounded-xl bg-slate-800 ${
                                    isPortraitCrop
                                        ? 'h-[min(55vh,28rem)] w-auto max-w-full'
                                        : 'mx-auto w-full'
                                } ${
                                    imageRatio && !isBusy ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
                                }`}
                                role="img"
                                aria-label="پیش‌نمایش برش"
                                style={{ aspectRatio }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={stopDragging}
                                onPointerCancel={stopDragging}
                            >
                            {imageRatio ? (
                                <img
                                    src={imageUrl}
                                    alt=""
                                    className="absolute max-w-none select-none"
                                    draggable={false}
                                    style={{
                                        width: `${(scaledWidth / outputWidth) * 100}%`,
                                        height: `${(scaledHeight / outputHeight) * 100}%`,
                                        left: `${-(offsetX / outputWidth) * 100}%`,
                                        top: `${-(offsetY / outputHeight) * 100}%`,
                                    }}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm font-bold text-white">
                                    در حال آماده‌سازی پیش‌نمایش...
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-7 text-slate-600">
                        تصویر را با موس یا لمس جابه‌جا کنید.
                    </div>
                    <label className="space-y-2 text-sm font-bold text-slate-700">
                        <span>بزرگ‌نمایی</span>
                        <input
                            type="range"
                            min={minZoom}
                            max={maxZoom}
                            step="0.05"
                            value={zoom}
                            onChange={(event) => setZoom(clamp(Number(event.target.value), minZoom, maxZoom))}
                            disabled={isBusy}
                            className="w-full accent-[joordak-coral]"
                        />
                    </label>
                </div>

                {cropError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                        {cropError}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isBusy}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={confirmCrop}
                        disabled={isBusy}
                        className="rounded-xl bg-joordak px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17475c] disabled:opacity-60"
                    >
                        {isBusy ? 'در حال آماده‌سازی...' : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
