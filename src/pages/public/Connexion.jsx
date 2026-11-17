import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';
import { Logo, Swoosh } from '../../components/Brand.jsx';
import { Button, Checkbox, Field, Segmented } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';

const ATOUTS = [
  'Modèles de CV et de lettres prêts à l’emploi',
  'Analyse et recommandations en moins d’une minute',
  'Préparation aux entretiens et conseiller dédié',
];

export default function Connexion() {
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'inscription' ? 'inscription' : 'connexion';
  const [erreurs, setErreurs] = useState({});

  const setMode = (m) => {
    setErreurs({});
    setParams(m === 'inscription' ? { mode: 'inscription' } : {}, { replace: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const err = {};
    if (mode === 'inscription' && !String(data.get('nom') || '').trim()) err.nom = 'Indiquez votre nom.';
    if (!/^\S+@\S+\.\S+$/.test(String(data.get('email') || ''))) err.email = 'Adresse e-mail invalide.';
    if (String(data.get('password') || '').length < 8) err.password = '8 caractères minimum.';
    if (mode === 'inscription' && !data.get('cgu')) err.cgu = 'Merci d’accepter la politique de confidentialité.';
    setErreurs(err);
    if (Object.keys(err).length === 0) navigate('/app');
  };

  return (
    <div className="auth">
      <section className="auth__panel">
        <Swoosh />
        <Logo onDark size={46} />
        <h1 className="auth__title rise">Votre candidature, de la première version à l’entretien.</h1>
        <ul className="auth__list">
          {ATOUTS.map((a, i) => (
            <li key={a} className="rise" style={{ '--i': i + 1 }}>
              <Icon name="check" size={20} stroke={2.5} />
              {a}
            </li>
          ))}
        </ul>
        <p className="auth__privacy">
          <Icon name="lock" size={18} />
          Vos documents restent privés et ne servent jamais à entraîner une IA.
        </p>
      </section>

      <section className="auth__form-wrap">
        <form className="auth__form rise" onSubmit={onSubmit} noValidate>
          <Segmented
            stretch
            label="Choix du formulaire"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'connexion', label: 'Connexion' },
              { value: 'inscription', label: 'Créer un compte' },
            ]}
          />
          <h2 className="auth__form-title">{mode === 'inscription' ? 'Créer mon compte' : 'Bon retour parmi nous'}</h2>

          {mode === 'inscription' && (
            <Field label="Nom complet" name="nom" placeholder="Ex. Amina Hassan" autoComplete="name" error={erreurs.nom} />
          )}
          <Field label="Adresse e-mail" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" error={erreurs.email} />
          <Field
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
            hint={mode === 'inscription' ? '8 caractères minimum.' : undefined}
            error={erreurs.password}
          />

          {mode === 'connexion' ? (
            <a href="#" className="auth__forgot">Mot de passe oublié ?</a>
          ) : (
            <div className="stack" style={{ '--gap': '4px' }}>
              <Checkbox name="cgu" label={<>J’accepte la <a href="#">politique de confidentialité</a>.</>} />
              {erreurs.cgu && <span className="field__hint field__hint--error">{erreurs.cgu}</span>}
            </div>
          )}

          <Button type="submit" size="lg" block>{mode === 'inscription' ? t('cta.signup') : t('cta.login')}</Button>

          <div className="auth__foot">
            <button type="button" className="ghost-btn" onClick={toggle} aria-label={t('lang.switch')}>
              <Icon name="globe" size={16} />
              {lang === 'fr' ? 'Français' : 'English'}
            </button>
            <span className="muted">Démo : <Link to="/conseiller">conseiller</Link> · <Link to="/admin">administrateur</Link></span>
          </div>
        </form>
      </section>
    </div>
  );
}
