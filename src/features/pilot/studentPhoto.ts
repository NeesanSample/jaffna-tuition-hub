/** Keep optional portraits small enough for this browser-storage demo. */
export async function readStudentPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw Error('Choose a JPG, PNG or WebP photo.')
  }
  if (file.size > 8 * 1024 * 1024) throw Error('Choose a photo smaller than 8 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw Error('This photo could not be read.')
    const scale = Math.min(1, 192 / image.naturalWidth, 240 / image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw Error('Photo preview is unavailable in this browser.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    let photo = canvas.toDataURL('image/jpeg', 0.8)
    for (const quality of [0.65, 0.5, 0.35]) {
      if (photo.length <= 12000) break
      photo = canvas.toDataURL('image/jpeg', quality)
    }
    if (photo.length > 12000) throw Error('This photo is too detailed to save. Try a smaller image.')
    return photo
  } catch (error) {
    if (error instanceof DOMException) throw Error('This image could not be opened. Try another JPG, PNG or WebP photo.')
    throw error
  } finally {
    URL.revokeObjectURL(url)
  }
}
