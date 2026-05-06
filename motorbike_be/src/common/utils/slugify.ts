/**
 * Chuyển tiếng Việt có dấu → slug ASCII-safe.
 * Ví dụ: "Thay dầu máy xe số" → "thay-dau-may-xe-so"
 */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
    â: 'a', ấ: 'a', ậ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ế: 'e', ệ: 'e', ề: 'e', ể: 'e', ễ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ố: 'o', ộ: 'o', ồ: 'o', ổ: 'o', ỗ: 'o',
    ơ: 'o', ớ: 'o', ợ: 'o', ờ: 'o', ở: 'o', ỡ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ứ: 'u', ự: 'u', ừ: 'u', ử: 'u', ữ: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd',
    // Uppercase
    À: 'a', Á: 'a', Ả: 'a', Ã: 'a', Ạ: 'a',
    Ă: 'a', Ắ: 'a', Ặ: 'a', Ằ: 'a', Ẳ: 'a', Ẵ: 'a',
    Â: 'a', Ấ: 'a', Ậ: 'a', Ầ: 'a', Ẩ: 'a', Ẫ: 'a',
    È: 'e', É: 'e', Ẻ: 'e', Ẽ: 'e', Ẹ: 'e',
    Ê: 'e', Ế: 'e', Ệ: 'e', Ề: 'e', Ể: 'e', Ễ: 'e',
    Ì: 'i', Í: 'i', Ỉ: 'i', Ĩ: 'i', Ị: 'i',
    Ò: 'o', Ó: 'o', Ỏ: 'o', Õ: 'o', Ọ: 'o',
    Ô: 'o', Ố: 'o', Ộ: 'o', Ồ: 'o', Ổ: 'o', Ỗ: 'o',
    Ơ: 'o', Ớ: 'o', Ợ: 'o', Ờ: 'o', Ở: 'o', Ỡ: 'o',
    Ù: 'u', Ú: 'u', Ủ: 'u', Ũ: 'u', Ụ: 'u',
    Ư: 'u', Ứ: 'u', Ự: 'u', Ừ: 'u', Ử: 'u', Ữ: 'u',
    Ỳ: 'y', Ý: 'y', Ỷ: 'y', Ỹ: 'y', Ỵ: 'y',
    Đ: 'd',
  };

  return text
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')           // khoảng trắng → gạch ngang
    .replace(/-+/g, '-');           // nhiều gạch ngang → 1
}

/**
 * Tạo slug unique: thêm timestamp (dạng base36) nếu slug gốc trùng.
 * Ví dụ: "thay-dau-may" → "thay-dau-may-1jk3m"
 */
export function slugifyUnique(text: string): string {
  const base = slugify(text);
  const suffix = Date.now().toString(36); // ngắn gọn ~8 ký tự
  return `${base}-${suffix}`;
}
