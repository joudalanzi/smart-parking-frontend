import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function NotificationsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      const data = await apiFetch('/api/reports/my');
      let list = Array.isArray(data?.reports) ? data.reports : [];
      const unreadIds = list.filter((r) => r.adminReply && !r.readAt).map((r) => r.id);
      if (unreadIds.length > 0) {
        await Promise.all(
          unreadIds.map((id) => apiFetch(`/api/reports/${encodeURIComponent(id)}/read`, { method: 'PATCH' }))
        );
        window.dispatchEvent(new CustomEvent('pnu-reports-read'));
        const again = await apiFetch('/api/reports/my');
        list = Array.isArray(again?.reports) ? again.reports : [];
      }
      setReports(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = [...reports];
    list.sort((a, b) => {
      const ua = a.adminReply && !a.readAt ? 1 : 0;
      const ub = b.adminReply && !b.readAt ? 1 : 0;
      if (ua !== ub) return ub - ua;
      const ta = new Date(a.updatedAt || a.createdAt).getTime();
      const tb = new Date(b.updatedAt || b.createdAt).getTime();
      return tb - ta;
    });
    return list;
  }, [reports]);

  const unreadWithReply = sorted.filter((r) => r.adminReply && !r.readAt).length;

  return (
    <div style={{ maxWidth: 820, marginInline: 'auto' }}>
      <div className="pageHeader">
        <div>
          <h1>الإشعارات</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            متابعة حالة بلاغاتك وقراءة رد الإدارة هنا بدل الاعتماد على البريد فقط.
          </p>
        </div>
        <button type="button" className="btn" onClick={load}>
          تحديث
        </button>
      </div>

      {loading ? <p className="muted">جاري التحميل...</p> : null}
      {err ? <p className="danger">{err}</p> : null}

      {!loading && unreadWithReply ? (
        <p className="muted" style={{ marginTop: 0 }}>
          لديك <strong style={{ color: 'var(--text)' }}>{unreadWithReply}</strong> رد/ردود جديدة من الإدارة.
        </p>
      ) : null}

      {!loading && sorted.length === 0 ? (
        <div className="card">
          <div className="cardBody">
            <p className="muted" style={{ margin: 0 }}>
              لا توجد بلاغات بعد. عند إرسال بلاغ سيظهر هنا حالته، وعند رد الإدارة ستصلك التفاصيل في هذه الصفحة.
            </p>
            <Link to="/my-reports" className="btn btnPrimary" style={{ marginTop: 14, display: 'inline-flex' }}>
              إرسال بلاغ
            </Link>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {sorted.map((r) => {
          const hasReply = Boolean(r.adminReply);
          const unread = hasReply && !r.readAt;
          return (
            <div key={r.id} className="card" style={unread ? { borderColor: 'rgba(34, 211, 238, 0.35)' } : undefined}>
              <div className="cardBody">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
                      {r.type} · {formatDt(r.createdAt)}
                    </div>
                    <h2 className="sectionTitle" style={{ marginTop: 8, marginBottom: 0 }}>
                      {r.subject}
                    </h2>
                  </div>
                  <span
                    className="chip"
                    style={{
                      fontWeight: 800,
                      borderColor: unread ? 'rgba(34, 211, 238, 0.35)' : undefined,
                      color: unread ? 'var(--text)' : undefined,
                    }}
                  >
                    {reportStatusLabel(r.status)}
                  </span>
                </div>

                {!hasReply ? (
                  <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
                    لم يُرد بعد — يمكنك مراجعة هذه الصفحة لاحقًا أو من «بلاغاتي».
                  </p>
                ) : (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                      رد الإدارة {r.adminReplyAt ? `· ${formatDt(r.adminReplyAt)}` : ''}
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{r.adminReply}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/my-reports" className="btn">
          بلاغاتي
        </Link>
      </div>
    </div>
  );
}
