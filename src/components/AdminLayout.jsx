import { NavLink, Outlet, useNavigate } from 'react-router-dom';

function navClass({ isActive }) {
  return `adminNavLink ${isActive ? 'adminNavLinkActive' : ''}`.trim();
}

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/auth', { replace: true });
  };

  return (
    <div className="adminShell">
      <aside className="adminAside">
        <div className="adminAsideInner">
          <div className="adminBrand">
            <img src="/logo.png" alt="صفَّة" className="adminBrandLogo" />
            <span>لوحة الإدارة</span>
          </div>
          <nav className="adminNav">
            <NavLink to="/admin/dashboard" className={navClass} end>
              نظرة عامة
            </NavLink>
            <NavLink to="/admin/zones" className={navClass}>
              المناطق
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
            <NavLink to="/" className={navClass} end>
              الموقع العام
            </NavLink>
          </nav>
          <div className="adminAsideStretch" aria-hidden />
          <div className="adminAsideFooter">
            <button type="button" className="btn" style={{ width: '100%' }} onClick={logout}>
              خروج
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
