import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

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

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/admin/reports', { admin: true });
      setRows(Array.isArray(data?.reports) ? data.reports : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
      if (/** @type {any} */ (e)?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 style={{ marginTop: 0 }}>البلاغات والاعتراضات</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            جميع البلاغات الواردة من العملاء مع البريد للتواصل.
          </p>
        </div>
        <button type="button" className="btn" onClick={load}>
          تحديث
        </button>
      </div>

      {loading ? <p className="muted">جاري التحميل...</p> : null}
      {msg ? <p className="danger">{msg}</p> : null}

      {!loading && rows.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <p className="muted" style={{ margin: 0 }}>
              لا توجد بلاغات بعد.
            </p>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((r) => {
          const mailHref = `mailto:${encodeURIComponent(r.userEmail)}?subject=${encodeURIComponent(`صفَّة — رد على بلاغ: ${r.subject}`)}`;
          return (
            <div key={r.id} className="card">
              <div className="cardBody">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                      {formatDt(r.createdAt)} · {r.type}
                    </div>
                    <h2 className="sectionTitle" style={{ marginTop: 8, marginBottom: 0 }}>
                      {r.subject}
                    </h2>
                  </div>
                  <a className="btn btnPrimary" href={mailHref} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    مراسلة العميل
                  </a>
                </div>
                <div className="grid2" style={{ marginTop: 14 }}>
                  <div className="kpi">
                    <div className="kpiLabel">اسم العميل</div>
                    <div className="kpiValue">{r.userName}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">البريد الإلكتروني</div>
                    <div className="kpiValue" dir="ltr" style={{ textAlign: 'right' }}>
                      <a href={mailHref} style={{ color: 'var(--primary)', fontWeight: 800 }}>
                        {r.userEmail}
                      </a>
                    </div>
                  </div>
                  {r.ticketId ? (
                    <div className="kpi">
                      <div className="kpiLabel">التذكرة</div>
                      <div className="kpiValue">{r.ticketId}</div>
                    </div>
                  ) : null}
                </div>
                <p className="muted" style={{ marginTop: 14, marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                  {r.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
