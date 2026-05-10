import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AdminDisabilityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/disability-requests/pending', { admin: true });
      setRows(Array.isArray(data?.requests) ? data.requests : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    setMsg('');
    try {
      await apiFetch(`/api/disability-requests/${encodeURIComponent(id)}/approve`, { method: 'POST', admin: true });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    }
  };

  const reject = async (id) => {
    if (!window.confirm('رفض هذا الطلب؟')) return;
    setMsg('');
    try {
      await apiFetch(`/api/disability-requests/${encodeURIComponent(id)}/reject`, { method: 'POST', admin: true });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    }
  };

  if (loading) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1 className="title" style={{ fontSize: 26, marginTop: 0 }}>
        طلبات ذوي الهمم
      </h1>
      <p className="subtitle">
        المستخدمون الذين رفعوا مستندًا عند التسجيل يظهر طلبهم هنا. بعد الموافقة يُفعَّل لهم اختيار مواقف العمود الأول (٦ مواقع لكل دور).
      </p>
      {msg ? <p className="danger">{msg}</p> : null}

      {rows.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <p className="muted" style={{ margin: 0 }}>
              لا توجد طلبات قيد المراجعة.
            </p>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="cardBody">
              <div className="grid2">
                <div className="kpi">
                  <div className="kpiLabel">الاسم</div>
                  <div className="kpiValue">{r.userName}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">البريد</div>
                  <div className="kpiValue">
                    <a href={`mailto:${r.userEmail}`} style={{ color: 'var(--primary)' }}>
                      {r.userEmail}
                    </a>
                  </div>
                </div>
              </div>
              {r.documentUrl ? (
                <p style={{ marginTop: 12 }}>
                  <a className="btn btnPrimary" href={r.documentUrl} target="_blank" rel="noreferrer">
                    عرض المستند المرفوع
                  </a>
                </p>
              ) : null}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn btnPrimary" onClick={() => approve(r.id)}>
                  اعتماد
                </button>
                <button type="button" className="btn btnDanger" onClick={() => reject(r.id)}>
                  رفض
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
