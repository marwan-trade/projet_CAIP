import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const cx = (...c) => c.filter(Boolean).join(' ');

/* ---------- Bouton : <Button to="/x"> (lien interne), href (externe) ou bouton ---------- */
export function Button({ to, href, variant = 'primary', size = 'md', icon, iconRight, block, className, children, ...rest }) {
  const cls = cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className);
  const inner = (
    <>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={18} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{inner}</a>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}

export function IconButton({ icon, label, className, badge, ...rest }) {
  return (
    <button type="button" className={cx('icon-btn', className)} aria-label={label} {...rest}>
      <Icon name={icon} size={20} />
      {badge && <span className="icon-btn__dot" aria-hidden="true" />}
    </button>
  );
}

/* ---------- Carte ---------- */
export function Card({ as: Tag = 'section', to, interactive, tone, className, children, ...rest }) {
  const cls = cx('card', interactive && 'card--interactive', tone && `card--${tone}`, className);
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  return <Tag className={cls} {...rest}>{children}</Tag>;
}

/* ---------- Pastille d'état ---------- */
const tones = { Haute: 'danger', Moyenne: 'warn', Basse: 'info' };
export function Badge({ tone = 'info', children }) {
  return <span className={cx('badge', `badge--${tones[tone] || tone}`)}>{children}</span>;
}

/* ---------- Barre de progression ---------- */
export function Progress({ value, label, tone = 'brand', size = 'md' }) {
  return (
    <div
      className={cx('progress', `progress--${size}`, tone === 'dark' && 'progress--on-dark')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className={cx('progress__fill', tone === 'success' && 'progress__fill--success')} style={{ width: `${value}%` }} />
    </div>
  );
}

/* ---------- Onglets segmentés ---------- */
export function Segmented({ options, value, onChange, label, size = 'md', stretch }) {
  return (
    <div className={cx('segmented', `segmented--${size}`, stretch && 'segmented--stretch')} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className="segmented__item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Pastilles de filtre ---------- */
export function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <button key={v} type="button" className="chip" aria-pressed={v === value} onClick={() => onChange(v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- En-tête de page ---------- */
export function PageHeader({ eyebrow, title, subtitle, actions, back }) {
  return (
    <header className="page-header rise">
      <div className="stack" style={{ '--gap': '6px' }}>
        {back && (
          <Link to={back.to} className="page-header__back">
            <Icon name="chevLeft" size={18} />
            {back.label}
          </Link>
        )}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}

/* ---------- Champ de formulaire ---------- */
export function Field({ label, hint, error, as = 'input', id, ...rest }) {
  const fieldId = id || `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const Control = as;
  return (
    <div className="field">
      <label htmlFor={fieldId} className="field__label">{label}</label>
      <Control id={fieldId} className={cx('field__control', error && 'field__control--error')} aria-invalid={!!error} aria-describedby={hint || error ? `${fieldId}-hint` : undefined} {...rest} />
      {(hint || error) && (
        <span id={`${fieldId}-hint`} className={cx('field__hint', error && 'field__hint--error')}>{error || hint}</span>
      )}
    </div>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="checkbox">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ initials, tone = 'electric', size = 44 }) {
  return (
    <span className={cx('avatar', `avatar--${tone}`)} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {initials}
    </span>
  );
}

/* ---------- Squelettes de chargement ---------- */
export function SkeletonBlock({ h = 120, className }) {
  return <div className={cx('skeleton', className)} style={{ height: h }} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="stack" style={{ '--gap': '20px' }} aria-busy="true">
      <SkeletonBlock h={56} />
      <div className="grid-auto">
        <SkeletonBlock h={180} />
        <SkeletonBlock h={180} />
      </div>
      <SkeletonBlock h={260} />
    </div>
  );
}

/* ---------- Encadré d'information ---------- */
export function Notice({ tone = 'info', icon = 'info', title, children, action }) {
  return (
    <div className={cx('notice', `notice--${tone}`)} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon name={icon} size={20} className="notice__icon" />
      <div className="notice__body">
        {title && <strong>{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Fenêtre modale ---------- */
export function Modal({ titre, onClose, children, actions, large }) {
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', echap);
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', echap);
      document.body.style.overflow = avant;
    };
  }, [onClose]);
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal__box', large && 'modal__box--large')} role="dialog" aria-modal="true" aria-labelledby="modal-titre">
        <div className="modal__head">
          <h2 id="modal-titre" className="card__title">{titre}</h2>
          <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose} autoFocus>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__foot">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------- État vide ou erreur de chargement ---------- */
export function ErreurChargement({ error, onRetry }) {
  return (
    <Notice tone="danger" icon="alert" title="Chargement impossible" action={onRetry && <Button variant="secondary" onClick={onRetry}>Réessayer</Button>}>
      {error?.message}
    </Notice>
  );
}
