import { Link } from 'react-router-dom';
import { useLang } from '../../i18n.jsx';
import { Doorway, Logo, Swoosh } from '../../components/Brand.jsx';
import { Badge, Button, Card } from '../../components/ui.jsx';
import Icon from '../../components/Icon.jsx';
import Vignette from '../../components/Vignette.jsx';

const PORTES = [
  { n: '01', titre: 'Votre CV', texte: 'Huit modèles prêts à remplir, en DOCX ou PDF, et un guide qui dit quoi écrire dans chaque rubrique.', icon: 'docLines' },
  { n: '02', titre: 'Votre lettre', texte: 'Cinq modèles de lettre, de la réponse à une offre à la candidature spontanée.', icon: 'mail' },
  { n: '03', titre: "L'analyse", texte: 'Déposez votre candidature : en moins d’une minute, vos points forts, vos points faibles et quoi corriger en premier.', icon: 'chart' },
  { n: '04', titre: "L'entretien", texte: 'Les questions qu’on vous posera, classées par thème, avec ce que le recruteur cherche vraiment.', icon: 'chat' },
  { n: '05', titre: 'La formation', texte: 'Six modules courts avec quiz, et une attestation de suivi à la fin.', icon: 'cap' },
];

const ETAPES_PARTENARIAT = [
  { titre: 'Le centre rejoint CAIP', texte: 'Une convention de partenariat est signée et le profil du centre est vérifié.' },
  { titre: 'Il publie ses formations', texte: 'Intitulé, durée, dates, présentiel ou à distance : ses formations apparaissent dans CAIP.' },
  { titre: 'CAIP oriente les candidats', texte: 'À partir du rapport d’analyse, la plateforme propose les formations qui comblent leurs points faibles.' },
  { titre: 'Un suivi partagé', texte: 'Inscription, présence et attestation remontent dans le parcours du candidat, avec son accord.' },
];

const AVANTAGES = [
  {
    pour: 'Pour les centres de formation',
    icon: 'users',
    points: ['Des candidats déjà orientés et motivés', 'Une visibilité auprès des demandeurs d’emploi', 'Un tableau de suivi de leurs inscrits'],
  },
  {
    pour: 'Pour les candidats',
    icon: 'door',
    mise: true,
    points: ['Une formation choisie d’après leur rapport', 'L’inscription en quelques clics', 'L’attestation ajoutée à leur parcours'],
  },
];

const CONSEILS = ['Les 5 rubriques d’un CV efficace', 'Se présenter en 2 minutes en entretien', 'Les erreurs courantes dans une lettre'];

function SiteHeader() {
  const { t, lang, toggle } = useLang();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />
        <nav className="site-header__nav" aria-label={t('nav.main')}>
          <a href="#portes">Le parcours</a>
          <a href="#modeles">Modèles</a>
          <a href="#confidentialite">Confidentialité</a>
          <a href="#partenaires">Partenaires</a>
        </nav>
        <div className="site-header__actions">
          <button type="button" className="ghost-btn" onClick={toggle} aria-label={t('lang.switch')}>
            <Icon name="globe" size={18} />
            {lang === 'fr' ? 'FR' : 'EN'}
          </button>
          <Button to="/connexion" variant="secondary">{t('cta.login')}</Button>
          <Button to="/connexion?mode=inscription" className="site-header__signup">{t('cta.signup')}</Button>
        </div>
      </div>
    </header>
  );
}

export default function Accueil() {
  const { t } = useLang();
  return (
    <div className="landing">
      <a href="#contenu" className="skip-link">{t('skip')}</a>
      <SiteHeader />

      <main id="contenu">
        <section className="hero">
          <Swoosh />
          <div className="container hero__inner">
            <div className="hero__text">
              <Badge tone="glow">Accompagnement vers l’emploi</Badge>
              <h1 className="hero__title rise" style={{ '--i': 1 }}>
                Ouvrez la porte de votre <span className="hero__accent">premier entretien</span>.
              </h1>
              <p className="hero__lead rise" style={{ '--i': 2 }}>
                Préparez votre CV et votre lettre, faites-les analyser, entraînez-vous aux questions d’entretien
                et avancez avec un conseiller. Au même endroit, depuis votre téléphone.
              </p>
              <div className="row rise" style={{ '--i': 3 }}>
                <Button to="/connexion?mode=inscription" variant="light" size="lg">{t('cta.signup')}</Button>
                <Button href="#modeles" variant="outline-light" size="lg">{t('cta.templates')}</Button>
              </div>
              <p className="hero__note rise" style={{ '--i': 4 }}>Inscription en moins de 2 minutes.</p>
            </div>

            <div className="hero__visual">
              <Doorway>
                <div className="hero-report">
                  <div className="row" style={{ '--gap': '14px' }}>
                    <span className="hero-report__score">78</span>
                    <div className="stack" style={{ '--gap': '4px' }}>
                      <strong>Rapport d’analyse</strong>
                      <span className="muted" style={{ fontSize: 13 }}>CV · Assistante comptable</span>
                    </div>
                  </div>
                  <ul className="hero-report__list">
                    <li><Badge tone="Haute">Haute</Badge>Chiffrez vos réalisations</li>
                    <li><Badge tone="Moyenne">Moyenne</Badge>Une seule page</li>
                    <li><Badge tone="Basse">Basse</Badge>E-mail professionnel</li>
                  </ul>
                </div>
              </Doorway>
            </div>
          </div>
        </section>

        <section id="portes" className="container section">
          <div className="section__head rise">
            <span className="eyebrow">Le parcours CAIP</span>
            <h2 className="section__title">Cinq portes entre vous et l’entretien</h2>
            <p className="muted section__lead">Avancez à votre rythme. Votre tableau de bord vous montre toujours la prochaine porte à ouvrir.</p>
          </div>
          <ol className="portes">
            {PORTES.map((p, i) => (
              <li key={p.n} className="porte rise" style={{ '--i': i }}>
                <span className="porte__num">{p.n}</span>
                <span className="porte__icon"><Icon name={p.icon} size={24} /></span>
                <h3 className="porte__title">{p.titre}</h3>
                <p className="muted">{p.texte}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="modeles" className="container section">
          <div className="section__head section__head--row">
            <div className="stack" style={{ '--gap': '8px' }}>
              <span className="eyebrow">Modèles</span>
              <h2 className="section__title">Partez d’une base solide</h2>
            </div>
            <Link to="/connexion" className="link-arrow">Voir toute la bibliothèque <Icon name="chevRight" size={18} /></Link>
          </div>
          <div className="grid-auto" style={{ '--min': '160px' }}>
            {[
              ['CV Classique', 'classique', '#1a4bff'],
              ['CV Moderne', 'colonne', '#1a4bff'],
              ['CV Premier emploi', 'classique', '#0e7a4f'],
              ['Lettre de motivation', 'lettre', '#1a4bff'],
            ].map(([nom, style, accent]) => (
              <Card key={nom} interactive className="template-card" to="/connexion">
                <Vignette style={style} accent={accent} />
                <strong>{nom}</strong>
              </Card>
            ))}
          </div>
        </section>

        <section id="confidentialite" className="container section">
          <div className="split">
          <Card className="privacy" style={{ flex: '1 1 380px' }}>
            <span className="privacy__icon"><Icon name="lock" size={26} /></span>
            <h2 className="card__title">Vos documents restent privés</h2>
            <p className="muted">
              Seul vous voyez votre CV et votre lettre. Ils ne sont partagés avec un conseiller que si vous le décidez,
              ne servent jamais à entraîner une intelligence artificielle, et vous pouvez les supprimer à tout moment.
            </p>
          </Card>
          <div className="stack" style={{ flex: '1 1 380px' }}>
            <h2 className="card__title">Conseils publics</h2>
            {CONSEILS.map((c) => (
              <Card key={c} as="a" href="#" interactive className="tip-link">
                <span>{c}</span>
                <Icon name="chevRight" size={18} />
              </Card>
            ))}
          </div>
          </div>
        </section>

        <section id="partenaires" className="container section partners">
          <div className="section__head rise">
            <span className="eyebrow">Partenariats</span>
            <h2 className="section__title">Un réseau de centres de formation autour de CAIP</h2>
            <p className="muted section__lead">
              CAIP oriente chaque candidat vers la formation qui comble ses lacunes. Les centres partenaires
              l’accueillent et suivent sa progression jusqu’à l’emploi.
            </p>
          </div>

          <div className="partners__flow">
            <h3 className="partners__subtitle">Comment fonctionne le partenariat</h3>
            <ol className="partner-steps">
              {ETAPES_PARTENARIAT.map((e, i) => (
                <li key={e.titre} className="partner-step rise" style={{ '--i': i }}>
                  <span className="partner-step__door" aria-hidden="true">{i + 1}</span>
                  <strong className="partner-step__title">{e.titre}</strong>
                  <p className="muted">{e.texte}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="partners__benefits">
            {AVANTAGES.map((a, i) => (
              <Card key={a.pour} className={`benefit rise${a.mise ? ' benefit--accent' : ''}`} style={{ '--i': i }}>
                <span className="benefit__icon"><Icon name={a.icon} size={24} /></span>
                <h3 className="card__title">{a.pour}</h3>
                <ul className="checklist">
                  {a.points.map((p) => (
                    <li key={p}><Icon name="check" size={18} stroke={2.5} />{p}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="partners__network">
            <div className="partners__logos" aria-label="Centres partenaires">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="partner-slot">
                  <Icon name="cap" size={22} />
                  <span>[Logo du centre partenaire]</span>
                </div>
              ))}
            </div>
            <div className="partners__join">
              <div className="stack" style={{ '--gap': '4px' }}>
                <strong>Vous êtes un centre de formation ?</strong>
                <span className="muted">Rejoignez le réseau et recevez des candidats déjà orientés vers vos formations.</span>
              </div>
              <Button href="#partenaires" iconRight="chevRight">Devenir partenaire</Button>
            </div>
          </div>
        </section>

        <section className="container section">
          <div className="cta-band">
            <Swoosh />
            <h2>Votre prochaine candidature commence ici.</h2>
            <Button to="/connexion?mode=inscription" variant="light" size="lg">{t('cta.signup')}</Button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Logo size={28} />
          <nav className="row" style={{ '--gap': '20px' }} aria-label="Liens légaux">
            <a href="#">Mentions légales</a>
            <a href="#">Confidentialité</a>
            <a href="#">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
