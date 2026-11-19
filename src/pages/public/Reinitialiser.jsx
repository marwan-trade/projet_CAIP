import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Logo } from '../../components/Brand.jsx';
import { Button, Card, Field, Notice } from '../../components/ui.jsx';

// Lien reçu par e-mail : /reinitialiser?jeton=…
export default function Reinitialiser() {
  const [params] = useSearchParams();
  const jeton = params.get('jeton') || '';
  const [erreurs, setErreurs] = useState({});
  const [fait, setFait] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const mdp = String(data.get('password') || '');
    const err = {};
    if (mdp.length < 8) err.password = '8 caractères minimum.';
    if (String(data.get('password2') || '') !== mdp) err.password2 = 'Les deux mots de passe ne correspondent pas.';
    setErreurs(err);
    if (Object.keys(err).length) return;
    setEnvoi(true);
    try {
      await api.reinitialiser(jeton, mdp);
      setFait(true);
    } catch (e2) {
      setErreurs({ ...e2.champs, global: e2.message });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="reset">
      <Logo size={44} />
      <Card className="reset__card rise">
        <h1 className="auth__form-title">Choisir un nouveau mot de passe</h1>
        {!jeton ? (
          <Notice tone="danger" icon="alert" title="Lien incomplet">
            Ouvrez le lien reçu par e-mail en entier, ou <Link to="/connexion?mode=oubli">demandez un nouveau lien</Link>.
          </Notice>
        ) : fait ? (
          <>
            <Notice tone="success" icon="check" title="Mot de passe modifié">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</Notice>
            <Button to="/connexion" size="lg" block>Se connecter</Button>
          </>
        ) : (
          <form className="stack" onSubmit={onSubmit} noValidate>
            <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" hint="8 caractères minimum." error={erreurs.password} />
            <Field label="Confirmer le mot de passe" name="password2" type="password" autoComplete="new-password" error={erreurs.password2} />
            {erreurs.global && (
              <Notice tone="danger" icon="alert">
                {erreurs.global} <Link to="/connexion?mode=oubli">Nouveau lien</Link>
              </Notice>
            )}
            <Button type="submit" size="lg" block disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
