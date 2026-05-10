/** تسميات حالات بلاغ المستخدم (متطابقة مع الباكند) */
export const REPORT_STATUS_LABELS = {
  pending: 'قيد الانتظار',
  in_review: 'قيد المراجعة',
  answered: 'تم الرد',
  closed: 'مغلق',
  rejected: 'مرفوض',
};

export function reportStatusLabel(status) {
  if (!status) return '—';
  return REPORT_STATUS_LABELS[status] || String(status);
}
