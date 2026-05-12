import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import saffaLogo from '../assets/saffa-logo.png';

function navLinkClass({ isActive }) {
  return `navLink ${isActive ? 'navLinkActive' : ''}`.trim();
}

function userDropLinkClass({ isActive }) {
  return `userDropdownLink ${isActive ? 'userDropdownLinkActive' : ''}`.trim();
}

export default function Layout() {
  const { isLoggedIn, logout, user, token, refreshMe } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (token) refreshMe();
  }, [token, refreshMe]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenuOpen]);

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="container topbarInner">
          <Link to="/" className="brand" aria-label="صفَّة">
            <img src={saffaLogo} alt="" className="brandMark" width={40} height={40} decoding="async" />
            <span className="brandName">صفَّة</span>
          </Link>

          <nav className="nav">
            <NavLink to="/" className={navLinkClass} end>
              الرئيسية
            </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                لوحة التحكم
              </NavLink>
              <NavLink to="/reservation" className={navLinkClass}>
                احجز
              </NavLink>
              <NavLink to="/booking" className={navLinkClass}>
                حجزي النشط
              </NavLink>
              <div className="userMenuWrap" ref={userMenuRef}>
                <button
                  type="button"
                  className={`chip userMenuBtn ${userMenuOpen ? 'userMenuBtnOpen' : ''}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <span>{user?.name || user?.email || 'مستخدم'}</span>
                  <span className="userMenuCaret" aria-hidden>
                    ▾
                  </span>
                </button>
                {userMenuOpen ? (
                  <div className="userDropdown" role="menu">
                    <NavLink to="/dashboard" className={userDropLinkClass} role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      لوحة التحكم
                    </NavLink>
                    <NavLink to="/my-bookings" className={userDropLinkClass} role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      حجوزاتي
                    </NavLink>
                    <NavLink to="/my-reports" className={userDropLinkClass} role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      بلاغاتي
                    </NavLink>
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={logout} className="btn">
                خروج
              </button>
            </>
          ) : (
            <NavLink to="/auth" className={navLinkClass}>
              دخول
            </NavLink>
          )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container">© صفَّة — حجز مواقف قبل الوصول</div>
      </footer>
    </div>
  );
}
