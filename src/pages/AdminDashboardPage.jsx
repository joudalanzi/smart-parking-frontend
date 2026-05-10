import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const d = await apiFetch('/api/admin/overview', { admin: true });
      setData(d);
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
        نظرة عامة على النظام
      </h1>
      <p className="subtitle" style={{ marginBottom: 20 }}>
        من هنا تدير المناطق، الخريطة، طلبات ذوي الهمم، الحجوزات، البلاغات والمخالفات.
      </p>

      {msg ? <p className="danger">{msg}</p> : null}

      <div className="grid2" style={{ gap: 14 }}>
        <StatCard label="المستخدمون" value={data?.usersCount ?? '—'} to="/admin/disability" hint="يعتمد ذوو الهمم على اعتماد الطلب" />
        <StatCard label="حجوزات نشطة" value={data?.reservationsActive ?? '—'} to="/admin/reservations" />
        <StatCard label="بانتظار الدخول" value={data?.reservationsPendingEntry ?? '—'} to="/admin/reservations" />
        <StatCard label="إجمالي الحجوزات" value={data?.reservationsTotal ?? '—'} to="/admin/reservations" />
        <StatCard label="طلبات همم قيد المراجعة" value={data?.pendingDisabilityRequests ?? '—'} to="/admin/disability" highlight />
        <StatCard label="بلاغات واعتراضات" value={data?.reportsTotal ?? '—'} to="/admin/reports" />
        <StatCard label="مناطق الخريطة" value={data?.mapZonesCount ?? '—'} to="/admin/zones" />
        <StatCard label="مخالفات مسجّلة" value={data?.violationsOpen ?? '—'} to="/admin/violations" />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">سياسة مواقف ذوي الهمم</h2>
          <p className="muted" style={{ margin: 0, lineHeight: 1.75 }}>
            بعد <strong>اعتماد الطلب</strong> يظهر للمستخدم في الحجز المواقف المخصّصة: <strong>العمود الأول</strong> من كل دور،{' '}
            <strong>أول {data?.accessibleSpotsPerFloor ?? 6} مواقف</strong> قرب البوابة (حسب منطق النظام الحالي).
          </p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/admin/zones" className="btn btnPrimary">
              إعداد المناطق والأعمدة
            </Link>
            <Link to="/admin/disability" className="btn">
              مراجعة طلبات ذوي الهمم
            </Link>
          </div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        الوثائق التقنية:{' '}
        <a href="/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
          Swagger /docs
        </a>
      </p>
    </div>
  );
}

function StatCard({ label, value, to, hint, highlight }) {
  return (
    <Link to={to} className={`adminStatCard ${highlight ? 'adminStatCardHi' : ''}`}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
        {label}
      </div>
      <div className="adminStatValue">{value}</div>
      {hint ? (
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          {hint}
        </div>
      ) : null}
    </Link>
  );
}
