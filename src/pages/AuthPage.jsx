import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../lib/authHelpers';
import PasswordInput from '../components/PasswordInput';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const { login, signup } = useAuth();

  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [disabledPerson, setDisabledPerson] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setDetails([]);
    setLoading(true);
    try {
      if (tab === 'login') {
        const normalizedEmail = email.trim().toLowerCase();
        const data = await login(normalizedEmail, password);
        if (data?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
        navigate(from, { replace: true });
        return;
      }
      if (!agreed) {
        setMsg('يجب الموافقة على الشروط');
        return;
      }
      if (disabledPerson && !docFile) {
        setMsg('ارفع مستند ذوي الهمم');
        return;
      }
      const pv = validatePassword(password);
      if (!pv.valid) {
        setMsg(pv.message || '');
        return;
      }
      if (disabledPerson && docFile) {
        const fd = new FormData();
        fd.append('name', name.trim());
        fd.append('email', email.trim().toLowerCase());
        fd.append('password', password);
        fd.append('isDisabledPerson', disabledPerson ? 'true' : 'false');
        fd.append('disabilityDocument', docFile);
        await signup(fd);
      } else {
        await signup({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          isDisabledPerson: disabledPerson,
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      const anyErr = /** @type {any} */ (err);
      const message = anyErr?.message || 'خطأ';
      const errs = Array.isArray(anyErr?.details) ? anyErr.details : [];
      setMsg(message);
      setDetails(
        errs
          .map((x) => x?.msg)
          .filter(Boolean)
          .slice(0, 6)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, marginInline: 'auto' }}>
      <div className="cardBody">
        <h1 className="title" style={{ fontSize: 28 }}>
          {tab === 'login' ? 'مرحبًا بك' : 'ابدأ مع صفَّة'}
        </h1>
        <p className="subtitle">
          {tab === 'login'
            ? 'سجل دخولك لإدارة حجوزاتك.'
            : 'أنشئ حسابًا خلال دقيقة واحدة ثم احجز موقفك قبل الوصول.'}
        </p>

        <div className="segmented" style={{ marginTop: 14 }}>
          <button type="button" className={`segBtn ${tab === 'login' ? 'segBtnActive' : ''}`} onClick={() => setTab('login')}>
            دخول
          </button>
          <button type="button" className={`segBtn ${tab === 'signup' ? 'segBtnActive' : ''}`} onClick={() => setTab('signup')}>
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        {tab === 'signup' ? (
          <div className="field">
            <div className="label">الاسم</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        ) : null}

        <div className="field">
          <div className="label">البريد الإلكتروني</div>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <div className="label">كلمة المرور</div>
          <PasswordInput
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {tab === 'signup' ? (
          <>
            <label className="chip" style={{ cursor: 'pointer', justifyContent: 'space-between', gap: 12 }}>
              <span>أوافق على الشروط</span>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            </label>
            <label className="chip" style={{ cursor: 'pointer', justifyContent: 'space-between', gap: 12 }}>
              <span>طلب مواقف ذوي الهمم</span>
              <input type="checkbox" checked={disabledPerson} onChange={(e) => setDisabledPerson(e.target.checked)} />
            </label>
            {disabledPerson ? (
              <div className="field">
                <div className="label">مستند (صورة أو PDF)</div>
                <input className="input" type="file" accept="image/*,.pdf" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              </div>
            ) : null}
          </>
        ) : null}

        {msg ? (
          <div className="kpi noticeDanger" style={{ margin: 0 }}>
            <div className="kpiLabel">خطأ</div>
            <div className="kpiValue" style={{ lineHeight: 1.8 }}>
              <div className="danger" style={{ fontWeight: 900 }}>{msg}</div>
              {details.length ? (
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', color: 'var(--muted)' }}>
                  {details.map((d, i) => (
                    <li key={i}>- {d}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'login' ? (
          <p className="muted" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7 }}>
            مسؤول النظام؟{' '}
            <Link to="/admin/login">دخول لوحة الإدارة</Link>
            {' '}أو استخدم بريد الأدمن في نموذج الدخول وسيتم توجيهك تلقائياً.
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" disabled={loading} className={`btn btnPrimary`} style={{ opacity: loading ? 0.75 : 1 }}>
            {loading ? 'جاري المعالجة...' : tab === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>
          <span className="muted" style={{ fontSize: 13 }}>
            بعد الدخول سيتم تحويلك تلقائيًا.
          </span>
        </div>
      </form>
      </div>
    </div>
  );
}
