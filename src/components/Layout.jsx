import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

function navLinkClass({ isActive }) {
  return `navLink ${isActive ? 'navLinkActive' : ''}`.trim();
}

function userDropLinkClass({ isActive }) {
  return `userDropdownLink ${isActive ? 'userDropdownLinkActive' : ''}`.trim();
}

export default function Layout() {
  const { isLoggedIn, logout, user, token, refreshMe } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [notifUnread, setNotifUnread] = useState(0);
  /** أثناء وجودك في صفحة الإشعارات لا نعرض الرقم؛ وبعد تعليم القراءة يُصفَّر من الخادم */
  const badgeCount = location.pathname === '/notifications' ? 0 : notifUnread;

  useEffect(() => {
    if (token) refreshMe();
  }, [token, refreshMe]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifUnread(0);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiFetch('/api/reports/unread-count');
        const n = typeof data?.count === 'number' ? data.count : 0;
        if (!cancelled) setNotifUnread(n);
      } catch {
        if (!cancelled) setNotifUnread(0);
      }
    };
    load();
    const id = setInterval(load, 45000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const onMarkedRead = () => setNotifUnread(0);
    window.addEventListener('pnu-reports-read', onMarkedRead);
    return () => window.removeEventListener('pnu-reports-read', onMarkedRead);
  }, []);

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
            <img src="/logo.png" alt="صفَّة" className="brandLogo" />
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
              <NavLink to="/notifications" className={navLinkClass}>
                الإشعارات
                {badgeCount > 0 ? (
                  <span className="navBadge" aria-label={`إشعارات غير مقروءة: ${badgeCount}`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                ) : null}
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
                    <NavLink to="/notifications" className={userDropLinkClass} role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      الإشعارات
                      {badgeCount > 0 ? (
                        <span className="navBadge navBadgeInline" aria-hidden>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      ) : null}
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
