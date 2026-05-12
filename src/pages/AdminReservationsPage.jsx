import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

function statusAr(s) {
  const m = {
    pending_entry: 'بانتظار الدخول',
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    violated: 'مخالفة',
  };
  return m[s] || s || '—';
}

export default function AdminReservationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/admin/reservations', { admin: true });
      setRows(Array.isArray(data?.reservations) ? data.reservations : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1 className="title" style={{ fontSize: 26, marginTop: 0 }}>
        كل الحجوزات
      </h1>
      <p className="subtitle">آخر الحجوزات المسجّلة في النظام مع بريد صاحب الحساب.</p>
      {msg ? <p className="danger">{msg}</p> : null}
      <button type="button" className="btn" style={{ marginBottom: 14 }} onClick={load}>
        تحديث
      </button>

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="cardBody">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{r.ticketId}</strong>
                <span className="chip">{statusAr(r.status)}</span>
              </div>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="kpi">
                  <div className="kpiLabel">المستخدم</div>
                  <div className="kpiValue">
                    {r.userName} —{' '}
                    <a href={`mailto:${r.userEmail}`} style={{ color: 'var(--primary)' }}>
                      {r.userEmail}
                    </a>
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المنطقة / الموقف</div>
                  <div className="kpiValue">
                    {r.zone} — {r.columnLabel || r.spot || '—'}
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">الوقت والمدة</div>
                  <div className="kpiValue">
                    {r.date} {r.time} — {r.duration}
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المبلغ / اللوحة</div>
                  <div className="kpiValue">
                    {r.amount} ر.س — {r.plateNumber}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
