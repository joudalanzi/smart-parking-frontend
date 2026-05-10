import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

function statusLabel(status) {
  switch (status) {
    case 'pending_entry':
      return 'بانتظار الدخول';
    case 'active':
      return 'نشط';
    case 'completed':
      return 'مكتمل';
    case 'cancelled':
      return 'ملغي';
    case 'violated':
      return 'مخالفة';
    default:
      return status || '—';
  }
}

export default function MyBookingsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/reservations/my');
      setRows(Array.isArray(data?.reservations) ? data.reservations : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ في التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 980, marginInline: 'auto' }}>
      <div className="pageHeader">
        <div>
          <h1>حجوزاتي</h1>
          <p>كل حجوزاتك السابقة والحالية حسب السيرفر.</p>
        </div>
        <Link to="/booking" className="chip" style={{ alignSelf: 'flex-start' }}>
          حجزي النشط
        </Link>
      </div>

      {loading ? <p className="muted">جاري التحميل...</p> : null}
      {msg ? (
        <p className="danger" style={{ marginBottom: 12 }}>
          {msg}
        </p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <p className="subtitle" style={{ margin: 0 }}>
              لا توجد حجوزات مسجلة بعد.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link to="/reservation" className="btn btnPrimary">
                احجز الآن
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((r) => (
          <div key={r.id || r.ticketId} className="card">
            <div className="cardBody">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                    التذكرة
                  </div>
                  <div style={{ fontWeight: 900, marginTop: 4 }}>{r.ticketId}</div>
                </div>
                <span className="chip">{statusLabel(r.status)}</span>
              </div>
              <div className="grid2" style={{ marginTop: 14 }}>
                <div className="kpi">
                  <div className="kpiLabel">المنطقة</div>
                  <div className="kpiValue">{r.zone}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">الموقف</div>
                  <div className="kpiValue">{r.columnLabel || r.spot || '—'}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">التاريخ والوقت</div>
                  <div className="kpiValue">
                    {r.date} — {r.time}
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المدة</div>
                  <div className="kpiValue">{r.duration}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المبلغ المحجوز</div>
                  <div className="kpiValue">{r.amount != null ? `${r.amount} ر.س` : '—'}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">اللوحة</div>
                  <div className="kpiValue">{r.plateNumber || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
