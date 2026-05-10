import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { reportStatusLabel } from '../lib/reportLabels';

function formatDt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listErr, setListErr] = useState('');
  const [type, setType] = useState('شكوى');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formOk, setFormOk] = useState('');

  const load = useCallback(async () => {
    setListErr('');
    try {
      const data = await apiFetch('/api/reports/my');
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (e) {
      setListErr(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setFormMsg('');
    setFormOk('');
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          details: details.trim(),
          ticketId: ticketId.trim() || undefined,
        }),
      });
      setFormOk('تم إرسال البلاغ بنجاح. تابع الحالة من «الإشعارات» عندما ترد الإدارة.');
      setSubject('');
      setDetails('');
      setTicketId('');
      await load();
    } catch (e) {
      const err = e instanceof Error ? e : new Error('خطأ');
      const detailsArr = /** @type {any} */ (err).details;
      if (Array.isArray(detailsArr) && detailsArr.length) {
        const lines = detailsArr.map((x) => x.msg || x.message || JSON.stringify(x)).filter(Boolean);
        setFormMsg(lines.join(' — ') || err.message);
      } else {
        setFormMsg(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, marginInline: 'auto' }}>
      <div className="pageHeader">
        <div>
          <h1>بلاغاتي</h1>
          <p>
            ارفع اعتراضًا أو شكوى؛ تصل بلاغاتك إلى لوحة الإدارة. عند الرد ستصلك التفاصيل في صفحة{' '}
            <Link to="/notifications">الإشعارات</Link>، مع إمكانية التواصل بالبريد عند الحاجة.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">بلاغ جديد</h2>
          <form onSubmit={submit} style={{ marginTop: 12 }}>
            <div className="field">
              <div className="label">النوع</div>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="شكوى">شكوى</option>
                <option value="اعتراض">اعتراض</option>
              </select>
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <div className="label">موضوع مختصر</div>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="مثلًا: خطأ في احتساب الوقت" />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <div className="label">التفاصيل</div>
              <textarea className="input" rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="اشرح ما حدث بوضوح…" />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <div className="label">رقم التذكرة (اختياري)</div>
              <input className="input" dir="ltr" style={{ textAlign: 'left' }} value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="إن كان البلاغ متعلقًا بحجز محدد" />
            </div>
            {formMsg ? (
              <p className="danger" style={{ marginTop: 12 }}>
                {formMsg}
              </p>
            ) : null}
            {formOk ? (
              <p className="success" style={{ marginTop: 12 }}>
                {formOk}
              </p>
            ) : null}
            <button type="submit" className="btn btnPrimary" style={{ marginTop: 14 }} disabled={submitting}>
              {submitting ? 'جاري الإرسال…' : 'إرسال البلاغ'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="cardBody">
          <h2 className="sectionTitle">سجل البلاغات</h2>
          {loading ? <p className="muted">جاري التحميل...</p> : null}
          {listErr ? <p className="danger">{listErr}</p> : null}
          {!loading && reports.length === 0 ? <p className="muted">لا توجد بلاغات بعد.</p> : null}
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {reports.map((rep) => (
              <div key={rep.id} className="kpi" style={{ textAlign: 'right' }}>
                <div className="kpiLabel" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span>
                    {rep.type} · {formatDt(rep.createdAt)}
                  </span>
                  <span className="chip" style={{ fontWeight: 800, fontSize: 12 }}>
                    {reportStatusLabel(rep.status)}
                  </span>
                </div>
                <div className="kpiValue" style={{ marginTop: 6 }}>
                  <strong>{rep.subject}</strong>
                </div>
                <p className="muted" style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {rep.details}
                </p>
                {rep.adminReply ? (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                      رد الإدارة {rep.adminReplyAt ? `· ${formatDt(rep.adminReplyAt)}` : ''}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{rep.adminReply}</p>
                    <Link to="/notifications" style={{ display: 'inline-block', marginTop: 8, fontWeight: 800, fontSize: 13 }}>
                      فتح في الإشعارات
                    </Link>
                  </div>
                ) : (
                  <p className="muted" style={{ margin: '10px 0 0', fontSize: 13 }}>
                    لم يُرد بعد — تابع من <Link to="/notifications">الإشعارات</Link>.
                  </p>
                )}
                {rep.ticketId ? (
                  <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                    التذكرة: <strong style={{ color: 'var(--text)' }}>{rep.ticketId}</strong>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link to="/booking" className="btn">
              العودة لحجزي النشط
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
