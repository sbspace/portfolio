const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_DATA_LENGTH = 350_000;

export function isMemoImageSource(value: string): boolean {
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export async function prepareMemoImage(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp|gif|bmp)$/.test(file.type)) {
    throw new Error('PNG, JPG, WebP 등 일반 이미지 형식으로 복사해 주세요.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('이미지가 너무 큽니다. 필요한 부분만 캡처해서 붙여넣어 주세요.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    let scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('이 브라우저에서 이미지 처리를 지원하지 않습니다.');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/webp', 0.85);
      if (data.length <= MAX_IMAGE_DATA_LENGTH && isMemoImageSource(data)) return data;
      scale *= 0.75;
    }
    throw new Error('이미지 용량을 줄일 수 없습니다. 더 작은 영역을 캡처해 주세요.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
