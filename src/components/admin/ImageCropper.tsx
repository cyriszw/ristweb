import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  aspect: number;
  aspectLabel?: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new Image();
  // Only set crossOrigin for remote URLs, not data URLs
  if (!imageSrc.startsWith('data:')) {
    image.crossOrigin = 'anonymous';
  }
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, crop.width, crop.height);
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
}

export default function ImageCropper({ open, imageSrc, aspect, aspectLabel, onComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea);
      onComplete(blob);
    } catch {
      console.error('Crop failed');
    }
    setProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Image {aspectLabel && <span className="text-muted-foreground text-sm font-normal">({aspectLabel})</span>}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-64 sm:h-80 bg-muted rounded-md overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
          <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={v => setZoom(v[0])} className="flex-1" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={processing}>{processing ? 'Cropping…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
