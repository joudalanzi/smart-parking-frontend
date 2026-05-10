import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

export default function ActiveBookingPage() {
  const [reservation, setReservation] = useState(null);
  const [msg, setMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderLeadMs, setReminderLeadMs] = useState(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/reservations/active');
      setReservation(data?.reservation ?? null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const ticketId = reservation?.ticketId;
  const status = reservation?.status;
  const statusLabel = getStatusLabel(status);
  const endAtMs = reservation?.endTimeAt ? new Date(reservation.endTimeAt).getTime() : null;
  const startedAtMs = reservation?.bookingStartedAt ? new Date(reservation.bookingStartedAt).getTime() : null;
  const durationMinutes = typeof reservation?.durationMinutes === 'number' ? reservation.durationMinutes : null;

  const action = async (path, method = 'POST') => {
    if (!ticketId) return;
    setMsg('');
    setSuccessMsg('');
    try {
      const data = await apiFetch(`/api/reservations/${encodeURIComponent(ticketId)}${path}`, { method });
      if (path === '/extend') {
        const extendAmount = data?.extendAmount ?? 2;
        setSuccessMsg(`تم التمديد 15 دقيقة بنجاح. المبلغ: ${extendAmount} ر.س`);
      } else if (path === '/end') {
        setSuccessMsg(data?.message ? String(data.message) : 'تم إنهاء الحجز');
      } else if (data?.message) {
        setSuccessMsg(data.message);
      }
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    }
  };

  const confirmEndBooking = async () => {
    setEndConfirmOpen(false);
    await action('/end');
  };

  useEffect(() => {
    if (status !== 'active' || !endAtMs) {
      setRemainingMs(null);
      return;
    }
    const tick = () => {
      setRemainingMs(Math.max(0, endAtMs - Date.now()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [status, endAtMs]);

  useEffect(() => {
    if (status !== 'active' || remainingMs == null || !ticketId) {
      setReminderOpen(false);
      setReminderLeadMs(null);
      return;
    }
    const remainingSec = Math.ceil(remainingMs / 1000);
    const totalMsRaw =
      startedAtMs && endAtMs ? Math.max(0, endAtMs - startedAtMs) : durationMinutes != null ? durationMinutes * 60 * 1000 : null;
    const leadMs = totalMsRaw != null ? computeReminderLeadMs(totalMsRaw) : 15 * 60 * 1000;
    setReminderLeadMs(leadMs);
    const leadSec = Math.ceil(leadMs / 1000);

    // لو صار تمديد وتغير endAtMs نسمح بتنبيه جديد (مفتاح يعتمد على endAtMs)
    const key = `saffa_extend_reminder_shown_${ticketId}_${endAtMs ?? 'noEnd'}`;
    const alreadyShown = localStorage.getItem(key) === 'true';

    if (!alreadyShown && remainingSec > 0 && remainingSec <= leadSec) {
      localStorage.setItem(key, 'true');
      setReminderOpen(true);
    }
  }, [status, remainingMs, ticketId, startedAtMs, endAtMs, durationMinutes]);

  const extendQuarterHour = async () => {
    await action('/extend');
    setReminderOpen(false);
  };

  if (loading) return <p className="muted">جاري التحميل...</p>;

  if (!reservation) {
    return (
      <div className="card" style={{ maxWidth: 720, marginInline: 'auto' }}>
        <div className="cardBody">
          {successMsg ? (
            <p className="success" style={{ marginTop: 0, marginBottom: 14, lineHeight: 1.75 }}>
              {successMsg}
            </p>
          ) : null}
          <h1 className="title" style={{ fontSize: 26 }}>لا يوجد حجز نشط</h1>
          <p className="subtitle">ابدأ بحجز موقفك الآن، ثم ستظهر هنا تفاصيل التذكرة.</p>
          <div style={{ marginTop: 14 }}>
            <Link to="/reservation" className="btn btnPrimary">
              احجز الآن
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, marginInline: 'auto' }}>
      {endConfirmOpen ? (
        <div
          className="modalBackdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-confirm-title"
          onClick={() => setEndConfirmOpen(false)}
        >
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2 id="end-confirm-title" className="sectionTitle" style={{ marginTop: 0 }}>
              تأكيد إنهاء الحجز
            </h2>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              هل أنت متأكد أنك تريد إنهاء الجلسة؟ بعد الإنهاء لا يمكن التراجع عن احتساب المدة الفعلية للوقوف.
            </p>
            <div className="kpi" style={{ marginTop: 14, marginBottom: 0 }}>
              <div className="kpiLabel">سياسة الرسوم عند الإنهاء</div>
              <div className="kpiValue" style={{ fontWeight: 700, lineHeight: 1.75 }}>
                أول <strong>نصف ساعة</strong> من بدء الحجز <strong>مجاناً</strong>، ثم كل <strong>١٥ دقيقة</strong> بمبلغ{' '}
                <strong>١ ر.س</strong> (يُحسب من وقت بدء الحجز حتى الإنهاء).
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setEndConfirmOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btnDanger" onClick={confirmEndBooking}>
                نعم، إنهاء الحجز
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pageHeader">
        <div>
          <h1>حجزي النشط</h1>
          <p>متابعة حالة الحجز وإدارة الوقت بسهولة.</p>
        </div>
        <span className="chip">
          التذكرة: <strong style={{ color: 'var(--text)' }}>{reservation.ticketId}</strong>
        </span>
      </div>

      <div className="card">
        <div className="cardBody">
          {status === 'active' && reminderOpen ? (
            <div className="kpi noticeDanger" style={{ marginBottom: 12 }}>
              <div className="kpiLabel">تذكير</div>
              <div className="kpiValue" style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span>
                  {reminderLeadMs != null ? (
                    <>يرجى التمديد قبل انتهاء الحجز بـ <strong>{formatLead(reminderLeadMs)}</strong> لتفادي الغرامة. هل تريد تمديد 15 دقيقة؟</>
                  ) : (
                    <>اقترب انتهاء الحجز. يرجى التمديد لتفادي الغرامة. هل تريد تمديد 15 دقيقة؟</>
                  )}
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btnPrimary" onClick={extendQuarterHour}>
                    تمديد 15 دقيقة
                  </button>
                  <button type="button" className="btn" onClick={() => setReminderOpen(false)}>
                    لاحقًا
                  </button>
                </span>
              </div>
            </div>
          ) : null}

          <div className="grid2">
            <div className="kpi">
              <div className="kpiLabel">المنطقة</div>
              <div className="kpiValue">{reservation.zone}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">الحالة</div>
              <div className="kpiValue">{statusLabel}</div>
            </div>
            {reservation.paymentCardLast4 ? (
              <div className="kpi" style={{ gridColumn: '1 / -1' }}>
                <div className="kpiLabel">الدفع</div>
                <div className="kpiValue" style={{ lineHeight: 1.65 }}>
                  بطاقة تنتهي بـ {arabicDigits(reservation.paymentCardLast4)}
                  {reservation.paymentExpiry ? ` — انتهاء ${reservation.paymentExpiry}` : ''}
                  {reservation.paymentHolderName ? ` — ${reservation.paymentHolderName}` : ''}
                </div>
              </div>
            ) : null}
          </div>

          {status === 'active' && remainingMs != null && reservation.endTimeAt ? (
            <div className="bookingTimeRow">
              <div className="timePanel">
                <div className="timePanelLabel">الوقت المتبقي</div>
                <div
                  className={`timePanelCountdown ${
                    remainingMs <= 3 * 60 * 1000 ? 'timePanelCountdownCritical' : remainingMs <= 10 * 60 * 1000 ? 'timePanelCountdownWarn' : ''
                  }`}
                >
                  {formatRemaining(remainingMs)}
                </div>
                <div className="timePanelHint">يتحدّث كل ثانية. إذا اقترب النهاية يُنصح بالتمديد لتفادي الغرامة.</div>
              </div>
              <div className="timePanel">
                <div className="timePanelLabel">موعد انتهاء الحجز</div>
                {(() => {
                  const { dateLine, timeLine } = formatEndParts(reservation.endTimeAt);
                  return (
                    <>
                      <div className="timePanelEndDate">{dateLine}</div>
                      <div className="timePanelEndClock">{timeLine}</div>
                      <div className="timePanelHint">هذا هو وقت انتهاء الجلسة الحالية حسب السيرفر.</div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : reservation.endTimeAt ? (
            <div className="bookingTimeRow">
              <div className="timePanel" style={{ gridColumn: '1 / -1' }}>
                <div className="timePanelLabel">موعد انتهاء الحجز</div>
                {(() => {
                  const { dateLine, timeLine } = formatEndParts(reservation.endTimeAt);
                  return (
                    <>
                      <div className="timePanelEndDate">{dateLine}</div>
                      <div className="timePanelEndClock">{timeLine}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {status === 'pending_entry' ? (
              <button type="button" onClick={() => action('/start')} className="btn btnPrimary">
                بدء الحجز
              </button>
            ) : null}
            {status === 'active' ? (
              <>
                <button type="button" onClick={() => action('/extend')} className="btn btnPrimary">
                  تمديد 15 دقيقة
                </button>
                <button type="button" onClick={() => setEndConfirmOpen(true)} className="btn btnDanger">
                  إنهاء الحجز
                </button>
              </>
            ) : null}
            <button type="button" onClick={load} className="btn">
              تحديث
            </button>
          </div>

          <p className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
            إذا كانت الحالة <strong>بانتظار الدخول</strong> ابدأ الحجز عند الوصول.
          </p>

          {successMsg ? <p className="success" style={{ marginTop: 10, marginBottom: 0 }}>{successMsg}</p> : null}
          {msg ? <p className="danger" style={{ marginTop: 10, marginBottom: 0 }}>{msg}</p> : null}
        </div>
      </div>
    </div>
  );
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function arabicDigits(str) {
  return String(str).replace(/\d/g, (d) => AR_DIGITS[parseInt(d, 10)]);
}

function getStatusLabel(status) {
  switch (status) {
    case 'pending_entry':
      return 'بانتظار الدخول';
    case 'active':
      return 'نشط';
    case 'completed':
      return 'مكتمل';
    case 'cancelled':
      return 'ملغي';
    default:
      return status || '—';
  }
}

function formatRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = h > 0 ? `${h} س ` : '';
  const mm = `${m}`.padStart(2, '0');
  const ss = `${s}`.padStart(2, '0');
  return `${hh}${mm}:${ss}`;
}

function formatEndParts(iso) {
  const d = new Date(iso);
  return {
    dateLine: d.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    timeLine: d.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  };
}

function computeReminderLeadMs(totalMs) {
  // تذكير "قبل النهاية بربع المدة" مع حد أدنى 20 ثانية
  const quarter = totalMs * 0.25;
  const minLead = 20_000;
  let lead = Math.max(minLead, quarter);

  // تقريب ذكي: لو أكبر من دقيقة قرّب للدقيقة، غير كذا قرّب لـ 5 ثواني
  if (lead >= 60_000) {
    lead = Math.round(lead / 60_000) * 60_000;
  } else {
    lead = Math.round(lead / 5_000) * 5_000;
  }
  return Math.max(minLead, lead);
}

function formatLead(ms) {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec} ثانية`;
  const min = Math.ceil(sec / 60);
  return `${min} دقيقة`;
}
