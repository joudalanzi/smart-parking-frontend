import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    { to: '/', title: 'الرئيسية والخريطة', desc: 'اختر المنطقة من الخريطة ثم انتقل للحجز.', primary: false },
    { to: '/reservation', title: 'احجز موقفاً', desc: 'الوقت، الموقف، وبيانات السيارة ثم الدفع.', primary: true },
    { to: '/booking', title: 'حجزي النشط', desc: 'بدء الجلسة، التمديد، أو إنهاء الحجز.', primary: true },
    { to: '/my-bookings', title: 'حجوزاتي', desc: 'عرض كل حجوزاتك السابقة والحالية.', primary: false },
    { to: '/my-reports', title: 'بلاغاتي', desc: 'إرسال شكوى أو اعتراض ومتابعة السجل.', primary: false },
    { to: '/payment', title: 'تأكيد الدفع', desc: 'يُفتح عادةً من مسار الحجز؛ للمراجعة بعد اختيار التفاصيل.', primary: false },
  ];

  return (
    <div style={{ maxWidth: 980, marginInline: 'auto' }}>
      <div className="pageHeader">
        <div>
          <h1>لوحة التحكم</h1>
          <p>
            مركز واحد لكل خدمات صفَّة. مرحباً <strong>{user?.name || user?.email || ''}</strong>.
          </p>
        </div>
      </div>

      <div className="grid2" style={{ gap: 16 }}>
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="dashCard">
            <div className="dashCardTitle">{c.title}</div>
            <p className="muted" style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.65 }}>
              {c.desc}
            </p>
            {c.primary ? <span className="dashCardBadge">أساسي</span> : null}
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">لوحة الإدارة (منفصلة عن حساب المستخدم)</h2>
          <p className="muted" style={{ marginTop: 0, lineHeight: 1.75 }}>
            إدارة المناطق، الخريطة، طلبات ذوي الهمم، كل الحجوزات، البلاغات والمخالفات — بحساب أدمن خاص.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link to="/admin/login" className="btn">
              دخول الأدمن
            </Link>
            <Link to="/admin/dashboard" className="btn btnPrimary">
              لوحة الإدارة الكاملة
            </Link>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13, marginBottom: 0 }}>
            المستندات التقنية للـ API:{' '}
            <a href="/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
              /docs
            </a>{' '}
            على نفس خادم الباكند (المنفذ 4000).
          </p>
        </div>
      </div>
    </div>
  );
}
