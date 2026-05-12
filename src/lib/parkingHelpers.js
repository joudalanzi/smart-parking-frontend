export function durationToMinutes(durationStr) {
  const map = {
    'دقيقة واحدة': 1,
    'ربع ساعة': 15,
    'ساعة واحدة': 60,
    ساعتان: 120,
    '٣ ساعات': 180,
    '٤ ساعات': 240,
    'يوم كامل': 24 * 60,
  };
  return map[durationStr] ?? 60;
}

export function estimateAmountRiyals(durationMinutes, pricePerHour = 5) {
  const hours = durationMinutes / 60;
  return Math.max(1, Math.ceil(hours * pricePerHour));
}

const ARABIC_NUMS = '٠١٢٣٤٥٦٧٨٩';
function toArabicNum(n) {
  return String(n).replace(/\d/g, (d) => ARABIC_NUMS[parseInt(d, 10)]);
}

export const ACCESSIBLE_SPOTS_PER_FLOOR = 6;

export function ensureColumnsHaveSpotsCount(columns) {
  if (!columns || !columns.length) return columns;
  const defaultSpotsCount = 10;
  return columns.map((c) => ({
    ...c,
    spotsCount: c.spotsCount != null ? c.spotsCount : defaultSpotsCount,
  }));
}

export function buildSpotsFromColumns(columns, accessibleApproved) {
  const spots = [];
  const cols = (columns || []).filter((c) => c.available !== false);
  const defaultSpotsCount = 10;
  cols.forEach((col, colIndex) => {
    const count = col.spotsCount != null ? col.spotsCount : defaultSpotsCount;
    for (let num = 1; num <= count; num++) {
      const isAccessibleOnly = colIndex === 0 && num <= ACCESSIBLE_SPOTS_PER_FLOOR;
      const label = `${col.name} — ${toArabicNum(num)}${isAccessibleOnly ? ' (ذوي الهمم)' : ''}`;
      if (isAccessibleOnly && !accessibleApproved) continue;
      spots.push({
        id: `${col.id}-${num}`,
        columnId: col.id,
        columnName: col.name,
        number: num,
        label,
        isAccessibleOnly,
      });
    }
  });
  return spots;
}

export function validateCarInfo(carType, plateNumber, carColor) {
  const t = (carType || '').trim();
  const p = (plateNumber || '').trim().replace(/\s/g, '');
  const c = (carColor || '').trim();
  if (t.length < 2) return { ok: false, msg: 'نوع السيارة يجب أن يكون حقيقيًا (حرفين على الأقل).' };
  if (!/[\u0600-\u06FFa-zA-Z]/.test(t)) return { ok: false, msg: 'نوع السيارة يجب أن يحتوي على حروف.' };
  if (p.length < 4 || p.length > 10) return { ok: false, msg: 'رقم اللوحة يجب أن يكون بين ٤ و١٠ أحرف/أرقام.' };
  if (!/[0-9٠-٩]/.test(p)) return { ok: false, msg: 'رقم اللوحة يجب أن يحتوي على أرقام.' };
  if (!/[\u0600-\u06FFa-zA-Z]/.test(p)) return { ok: false, msg: 'رقم اللوحة يجب أن يحتوي على حروف.' };
  if (c.length < 2) return { ok: false, msg: 'لون السيارة يجب أن يكون حقيقيًا (حرفين على الأقل).' };
  if (!/[\u0600-\u06FFa-zA-Z]/.test(c)) return { ok: false, msg: 'لون السيارة يجب أن يحتوي على حروف.' };
  return { ok: true, carType: t, plateNumber: p, carColor: c };
}
