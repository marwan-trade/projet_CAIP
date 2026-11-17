import { Suspense } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Logo } from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, IconButton, PageSkeleton } from '../components/ui.jsx';

// Navigation par rôle. `mobile: false` = absent de la barre du bas (5 entrées max).
const NAV = {
  candidat: [
    { to: '/app', end: true, key: 'nav.home', icon: 'home' },
    { to: '/app/modeles', key: 'nav.templates', icon: 'doc' },
    { to: '/app/analyse/rapport', key: 'nav.analyses', icon: 'chart', match: '/app/analyse' },
    { to: '/app/entretiens', key: 'nav.interviews', icon: 'chat', mobile: false },
    { to: '/app/formation', key: 'nav.training', icon: 'cap' },
    { to: '/app/accompagnement', key: 'nav.advisor', icon: 'user' },
  ],
  conseiller: [
    { to: '/conseiller', end: true, key: 'nav.requests', icon: 'inbox' },
    { to: '/conseiller/messages', key: 'nav.messages', icon: 'chat' },
    { to: '/conseiller/ressources', key: 'nav.resources', icon: 'book' },
  ],
  admin: [
    { to: '/admin', end: true, key: 'nav.indicators', icon: 'chart' },
    { to: '/admin/contenus', key: 'nav.contents', icon: 'doc' },
    { to: '/admin/comptes', key: 'nav.accounts', icon: 'users' },
    { to: '/admin/assignations', key: 'nav.assignments', icon: 'shuffle' },
    { to: '/admin/audit', key: 'nav.audit', icon: 'shield' },
  ],
};

const PEOPLE = {
  candidat: { initials: 'AH', name: 'Amina Hassan', sub: 'nav.profile', to: '/app/profil', tone: 'electric' },
  conseiller: { initials: 'MA', name: 'M. Ali', sub: 'Conseiller', to: '/conseiller', tone: 'navy' },
  admin: { initials: 'AD', name: 'Administration', sub: 'Administrateur', to: '/admin', tone: 'ink' },
};

function NavItems({ role, variant }) {
  const { t } = useLang();
  const { pathname } = useLocation();
  const items = NAV[role].filter((i) => variant !== 'bottom' || i.mobile !== false);
  return items.map((i) => (
    <NavLink
      key={i.to}
      to={i.to}
      end={i.end}
      className={({ isActive }) => {
        const active = isActive || (i.match && pathname.startsWith(i.match));
        return `nav-item nav-item--${variant}${active ? ' is-active' : ''}`;
      }}
    >
      <Icon name={i.icon} size={variant === 'bottom' ? 22 : 20} />
      <span>{t(i.key)}</span>
    </NavLink>
  ));
}

export default function AppLayout({ role = 'candidat' }) {
  const { t, lang, toggle } = useLang();
  const me = PEOPLE[role];
  const sub = me.sub.startsWith('nav.') ? t(me.sub) : me.sub;

  return (
    <div className={`app app--${role}`}>
      <a href="#contenu" className="skip-link">{t('skip')}</a>

      {/* Ordinateur : barre latérale */}
      <aside className="app-side">
        <Logo to={role === 'candidat' ? '/app' : `/${role}`} />
        <nav aria-label={t('nav.main')} className="app-side__nav">
          <NavItems role={role} variant="side" />
        </nav>
        <div className="app-side__foot">
          <Link to={me.to} className="me-card">
            <Avatar initials={me.initials} tone={me.tone} size={38} />
            <span className="me-card__text">
              <strong>{me.name}</strong>
              <span>{sub}</span>
            </span>
          </Link>
          <div className="row" style={{ '--gap': '6px' }}>
            <button type="button" className="ghost-btn" onClick={toggle} aria-label={t('lang.switch')}>
              <Icon name="globe" size={18} />
              {lang === 'fr' ? 'FR' : 'EN'}
            </button>
            <Link to="/" className="ghost-btn">
              <Icon name="logout" size={18} />
              {t('nav.logout')}
            </Link>
          </div>
        </div>
      </aside>

      {/* Tablette et mobile : barre du haut */}
      <header className="app-top">
        <div className="app-top__bar">
          <Logo to={role === 'candidat' ? '/app' : `/${role}`} size={34} />
          <div className="row" style={{ '--gap': '8px' }}>
            <button type="button" className="ghost-btn" onClick={toggle} aria-label={t('lang.switch')}>
              {lang === 'fr' ? 'FR' : 'EN'}
            </button>
            <IconButton icon="bell" label={t('notifications')} badge />
            <Link to={me.to} aria-label={sub}>
              <Avatar initials={me.initials} tone={me.tone} size={40} />
            </Link>
          </div>
        </div>
        <nav aria-label={t('nav.main')} className="app-top__tabs">
          <NavItems role={role} variant="top" />
        </nav>
      </header>

      <main id="contenu" className="app-main" tabIndex={-1}>
        <div className="app-main__inner">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile : barre du bas, sous le pouce */}
      <nav aria-label={t('nav.main')} className="app-bottom">
        <NavItems role={role} variant="bottom" />
      </nav>
    </div>
  );
}
