import { BadRequestException } from '@nestjs/common';

/**
 * Helper parse YYYY-MM-DD → Date (giờ local).
 * Throw BadRequestException nếu format sai.
 */
function parseDate(value: string | undefined, fieldName: string): Date {
  if (!value) return null as any;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new BadRequestException(
      `${fieldName} không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD.`,
    );
  }

  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} không phải ngày hợp lệ.`);
  }
  return date;
}

/**
 * Parse và validate query params ?from=YYYY-MM-DD&to=YYYY-MM-DD.
 *
 * Rules:
 *  - Mặc định: from = đầu tháng hiện tại, to = cuối tháng hiện tại
 *  - from phải <= to
 *  - Khoảng cách tối đa 365 ngày
 *
 * Trả về { from: Date, to: Date } đã được set giờ boundary.
 */
export function parseDateRange(
  fromStr?: string,
  toStr?: string,
): { from: Date; to: Date } {
  const now = new Date();

  // Default: đầu tháng → cuối tháng hiện tại
  let from: Date;
  let to: Date;

  if (!fromStr) {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = parseDate(fromStr, 'from');
  }

  if (!toStr) {
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // ngày cuối tháng
  } else {
    to = parseDate(toStr, 'to');
  }

  // Set boundary giờ để bao phủ toàn ngày
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  // Validate from <= to
  if (from > to) {
    throw new BadRequestException(
      `"from" (${fromStr}) phải nhỏ hơn hoặc bằng "to" (${toStr}).`,
    );
  }

  // Validate khoảng cách tối đa 365 ngày
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    throw new BadRequestException(
      `Khoảng thời gian tối đa là 365 ngày. Hiện tại: ${diffDays} ngày.`,
    );
  }

  return { from, to };
}
