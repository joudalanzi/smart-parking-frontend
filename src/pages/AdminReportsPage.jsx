import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { REPORT_STATUS_LABELS } from '../lib/reportLabels';

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

const STATUS_OPTIONS = Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

function ReportCard({ row, onSaved }) {
  const [status, setStatus] = useState(row.status || 'pending');
  const [adminReply, setAdminReply] = useState(row.adminReply ? String(row.adminReply) : '');
  const [saving, setSaving] = useState(false);
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    setStatus(row.status || 'pending');
    setAdminReply(row.adminReply ? String(row.adminReply) : '');
  }, [row.id, row.status, row.adminReply]);

  const save = async () => {
    setLocalErr('');
    setSaving(true);
    try {
      await apiFetch(`/api/admin/reports/${encodeURIComponent(row.id)}`, {
        admin: true,
        method: 'PATCH',
        body: JSON.stringify({
          status,
          adminReply: adminReply.trim() || null,
        }),
      });
      await onSaved();
    } catch (e) {
      setLocalErr(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setSaving(false);
    }
  };

  const mailHref = `mailto:${encodeURIComponent(row.userEmail)}?subject=${encodeURIComponent(`صفَّة — رد على بلاغ: ${row.subject}`)}`;

  return (
    <div className="card">
      <div className="cardBody">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
              {formatDt(row.createdAt)} · {row.type}
            </div>
            <h2 className="sectionTitle" style={{ marginTop: 8, marginBottom: 0 }}>
              {row.subject}
            </h2>
          </div>
          <a className="btn" href={mailHref} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            بريد (اختياري)
          </a>
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          <div className="kpi">
            <div className="kpiLabel">اسم العميل</div>
            <div className="kpiValue">{row.userName}</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">البريد الإلكتروني</div>
            <div className="kpiValue" dir="ltr" style={{ textAlign: 'right' }}>
              <a href={mailHref} style={{ color: 'var(--primary)', fontWeight: 800 }}>
                {row.userEmail}
              </a>
            </div>
          </div>
          {row.ticketId ? (
            <div className="kpi">
              <div className="kpiLabel">التذكرة</div>
              <div className="kpiValue">{row.ticketId}</div>
            </div>
          ) : null}
        </div>
        <p className="muted" style={{ marginTop: 14, marginBottom: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
          {row.details}
        </p>

        <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
            رد الإدارة يظهر للعميل في صفحة «الإشعارات» في الموقع (مع التحديث على الحالة).
          </p>
          <div className="field">
            <div className="label">حالة البلاغ</div>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <div className="label">رد الإدارة للعميل</div>
            <textarea
              className="input"
              rows={4}
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
              placeholder="اكتب ردًا يظهر للعميل في الإشعارات…"
            />
          </div>
          {row.adminReplyAt ? (
            <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
              آخر تحديث للرد: {formatDt(row.adminReplyAt)}
              {row.readAt ? ` · قراءة العميل: ${formatDt(row.readAt)}` : ' · لم يُعلَّم كمقروء بعد'}
            </p>
          ) : null}
          {localErr ? (
            <p className="danger" style={{ marginTop: 12 }}>
              {localErr}
            </p>
          ) : null}
          <button type="button" className="btn btnPrimary" style={{ marginTop: 12 }} onClick={save} disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'حفظ الرد والحالة'}
          </button>
        </div>
      </div>
    </div>
  );
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
            حدّث حالة البلاغ وأرسل ردًا يظهر للعميل في «الإشعارات» بدل الاعتماد على البريد فقط.
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
        {rows.map((r) => (
          <ReportCard key={r.id} row={r} onSaved={load} />
        ))}
      </div>
    </div>
  );
}
