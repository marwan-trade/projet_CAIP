import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';
import { api } from '../../services/api.js';
import { ESPACE, useSession } from '../../session.jsx';
import { Logo, Swoosh } from '../../components/Brand.jsx';
import { Button, Checkbox, Field, Notice, Segmented } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import PartnerLogos from '../../components/PartnerLogos.jsx';

const ATOUTS = [
  'Modèles de CV et de lettres prêts à l’emploi',
  'Analyse et recommandations en moins d’une minute',
  'Préparation aux entretiens et conseiller dédié',
];

const MODES = ['connexion', 'inscription', 'oubli'];

function MotDePasseOublie({ onRetour }) {
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState('');
  const [lienDemo, setLienDemo] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErreur('Adresse e-mail invalide.');
      return;
    }
    setErreur('');
    setEnvoi(true);
    try {
      const r = await api.motDePasseOublie(email);
      setLienDemo(r.lienDemo);
      setEnvoye(email);
    } catch (err) {
      setErreur(err.champs?.email || err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form className="auth__form rise" onSubmit={onSubmit} noValidate>
      <button type="button" className="auth__back" onClick={onRetour}>
        <Icon name="chevLeft" size={18} />
        Retour à la connexion
      </button>
      <h2 className="auth__form-title">Mot de passe oublié</h2>

      {envoye ? (
        <>
          <Notice tone="success" icon="mail" title="Vérifiez votre boîte e-mail">
            Si un compte existe pour {envoye}, nous venons d’y envoyer un lien pour choisir un nouveau mot de passe.
            Pensez à regarder dans les courriers indésirables.
          </Notice>
          {lienDemo && (
            <Notice tone="info" icon="info" title="Version de démonstration">
              L’envoi d’e-mails n’est pas encore branché. <Link to={lienDemo}>Choisir un nouveau mot de passe</Link>
            </Notice>
          )}
          <Button size="lg" block onClick={onRetour}>Retour à la connexion</Button>
          <button type="button" className="auth__link" onClick={() => setEnvoye('')}>
            Je n’ai rien reçu : renvoyer le lien
          </button>
        </>
      ) : (
        <>
          <p className="muted">
            Indiquez l’adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </p>
          <Field label="Adresse e-mail" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" error={erreur} />
          <Button type="submit" size="lg" block disabled={envoi}>{envoi ? 'Envoi…' : 'Recevoir le lien'}</Button>
        </>
      )}
    </form>
  );
}

export default function Connexion() {
  const { t, lang, toggle } = useLang();
  const [params, setParams] = useSearchParams();
  const mode = MODES.includes(params.get('mode')) ? params.get('mode') : 'connexion';
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const { utilisateur, definir } = useSession();
  const suite = params.get('suite');

  const setMode = (m) => {
    setErreurs({});
    setParams(m === 'connexion' ? {} : { mode: m }, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const motDePasse = String(data.get('password') || '');
    const err = {};
    if (mode === 'inscription' && !String(data.get('nom') || '').trim()) err.nom = 'Indiquez votre nom.';
    if (!/^\S+@\S+\.\S+$/.test(String(data.get('email') || ''))) err.email = 'Adresse e-mail invalide.';
    if (motDePasse.length < 8) err.password = '8 caractères minimum.';
    if (mode === 'inscription') {
      const confirmation = String(data.get('password2') || '');
      if (!confirmation) err.password2 = 'Confirmez votre mot de passe.';
      else if (confirmation !== motDePasse) err.password2 = 'Les deux mots de passe ne correspondent pas.';
      if (!data.get('cgu')) err.cgu = 'Merci d’accepter la politique de confidentialité.';
    }
    setErreurs(err);
    if (Object.keys(err).length > 0) return;
    setEnvoi(true);
    try {
      const email = String(data.get('email')).trim();
      const u =
        mode === 'inscription'
          ? await api.inscription({ nom: String(data.get('nom')).trim(), email, password: motDePasse, cgu: true, langue: lang })
          : await api.connexion(email, motDePasse);
      definir(u); // la redirection vers son espace se fait juste en dessous
    } catch (e2) {
      setErreurs({ ...e2.champs, global: Object.keys(e2.champs || {}).length ? '' : e2.message });
      setEnvoi(false);
    }
  };

  // Déjà connecté : direction son espace.
  if (utilisateur) {
    const espace = ESPACE[utilisateur.role];
    return <Navigate to={suite && suite.startsWith(espace) ? suite : espace} replace />;
  }

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
        <div className="auth__partners">
          <h2 className="auth__partners-title">Avec nos centres de formation partenaires</h2>
          <PartnerLogos compact onDark />
        </div>
        <p className="auth__privacy">
          <Icon name="lock" size={18} />
          Vos documents restent privés et ne servent jamais à entraîner une IA.
        </p>
      </section>

      <section className="auth__form-wrap">
        {mode === 'oubli' ? (
          <MotDePasseOublie onRetour={() => setMode('connexion')} />
        ) : (
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
              key={`password-${mode}`}
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
              hint={mode === 'inscription' ? '8 caractères minimum.' : undefined}
              error={erreurs.password}
            />

            {mode === 'inscription' && (
              <Field
                label="Confirmer le mot de passe"
                name="password2"
                type="password"
                autoComplete="new-password"
                error={erreurs.password2}
              />
            )}

            {mode === 'connexion' ? (
              <button type="button" className="auth__forgot" onClick={() => setMode('oubli')}>Mot de passe oublié ?</button>
            ) : (
              <div className="stack" style={{ '--gap': '4px' }}>
                <Checkbox name="cgu" label={<>J’accepte la <a href="#">politique de confidentialité</a>.</>} />
                {erreurs.cgu && <span className="field__hint field__hint--error">{erreurs.cgu}</span>}
              </div>
            )}

            {erreurs.global && <Notice tone="danger" icon="alert">{erreurs.global}</Notice>}
            <Button type="submit" size="lg" block disabled={envoi}>
              {envoi ? 'Un instant…' : mode === 'inscription' ? t('cta.signup') : t('cta.login')}
            </Button>

            <div className="auth__foot">
              <button type="button" className="ghost-btn" onClick={toggle} aria-label={t('lang.switch')}>
                <Icon name="globe" size={16} />
                {lang === 'fr' ? 'Français' : 'English'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
