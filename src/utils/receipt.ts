const MAX_BYTES = 15 * 1024 * 1024
const MAX_EDGE = 1280
const JPEG_QUALITY = 0.72

export async function fileToReceiptDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose a photo')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Photo is too large (15 MB max)')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Could not read that photo')
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not read that photo')
    context.drawImage(bitmap, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } finally {
    bitmap.close()
  }
}
