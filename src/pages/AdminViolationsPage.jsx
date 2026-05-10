import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AdminViolationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/violations', { admin: true });
      setRows(Array.isArray(data?.violations) ? data.violations : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (id, status) => {
    setMsg('');
    try {
      await apiFetch(`/api/violations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        admin: true,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    }
  };

  if (loading) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1 className="title" style={{ fontSize: 26, marginTop: 0 }}>
        المخالفات
      </h1>
      <p className="subtitle">سجلات تجاوز الوقت أو المخالفات المسجّلة آلياً.</p>
      {msg ? <p className="danger">{msg}</p> : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.length === 0 ? (
          <p className="muted">لا توجد مخالفات.</p>
        ) : null}
        {rows.map((v) => (
          <div key={v.id} className="card">
            <div className="cardBody">
              <div className="grid2">
                <div className="kpi">
                  <div className="kpiLabel">التذكرة / اللوحة</div>
                  <div className="kpiValue">
                    {v.ticketId} — {v.plateNumber}
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المنطقة</div>
                  <div className="kpiValue">{v.zone}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">الحالة</div>
                  <div className="kpiValue">{v.status}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={() => mark(v.id, 'processed')}>
                  تمت المعالجة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
