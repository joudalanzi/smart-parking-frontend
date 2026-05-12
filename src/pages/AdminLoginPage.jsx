import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (data?.token) {
        localStorage.setItem('adminToken', data.token);
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'خطأ في الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appShell">
      <main className="main">
        <div className="container" style={{ maxWidth: 460, paddingTop: 48, paddingBottom: 48 }}>
          <div className="card">
            <div className="cardBody">
              <h1 className="title" style={{ fontSize: 24 }}>
                دخول لوحة الإدارة
              </h1>
              <p className="subtitle">لوحة إدارة كاملة: المناطق، الخريطة، ذوي الهمم، الحجوزات، البلاغات والمخالفات.</p>
              <form onSubmit={submit} style={{ marginTop: 18 }}>
                <div className="field">
                  <div className="label">البريد</div>
                  <input className="input" dir="ltr" style={{ textAlign: 'left' }} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <div className="label">كلمة المرور</div>
                  <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {msg ? (
                  <p className="danger" style={{ marginTop: 12 }}>
                    {msg}
                  </p>
                ) : null}
                <button type="submit" className="btn btnPrimary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
                  {loading ? 'جاري الدخول…' : 'دخول'}
                </button>
              </form>
              <p style={{ marginTop: 18 }}>
                <Link to="/" className="muted">
                  العودة للموقع
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
