import { NavLink, Outlet, useNavigate } from 'react-router-dom';

function navClass({ isActive }) {
  return `adminNavLink ${isActive ? 'adminNavLinkActive' : ''}`.trim();
}

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="adminShell">
      <aside className="adminAside">
        <div className="adminAsideInner">
          <div className="adminBrand">صفَّة — لوحة الإدارة</div>
          <nav className="adminNav">
            <NavLink to="/admin/dashboard" className={navClass} end>
              نظرة عامة
            </NavLink>
            <NavLink to="/admin/zones" className={navClass}>
              المناطق والأعمدة والأدوار
            </NavLink>
            <NavLink to="/admin/map" className={navClass}>
              مناطق الخريطة
            </NavLink>
            <NavLink to="/admin/disability" className={navClass}>
              طلبات ذوي الهمم
            </NavLink>
            <NavLink to="/admin/reservations" className={navClass}>
              كل الحجوزات
            </NavLink>
            <NavLink to="/admin/reports" className={navClass}>
              البلاغات والاعتراضات
            </NavLink>
            <NavLink to="/admin/violations" className={navClass}>
              المخالفات
            </NavLink>
          </nav>
          <div className="adminAsideFooter">
            <a href="/" className="btn" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              الموقع العام
            </a>
            <button type="button" className="btn" style={{ width: '100%', marginTop: 10 }} onClick={logout}>
              خروج الأدمن
            </button>
          </div>
        </div>
      </aside>
      <main className="adminMain">
        <div className="adminMainInner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
