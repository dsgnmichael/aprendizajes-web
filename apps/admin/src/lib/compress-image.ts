import imageCompression from 'browser-image-compression';

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= 3 * 1024 * 1024) return file; // Si pesa menos de 3MB, se sube normal
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  } catch (error) {
    console.error('Error comprimiendo imagen', error);
    return file;
  }
}