import { useState } from 'react';
import { api } from '../../services/api.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Button, Card, PageHeader, PageSkeleton } from '../../components/ui.jsx';
import { Swoosh } from '../../components/Brand.jsx';
import Icon from '../../components/Icon.jsx';

export default function Entretiens() {
  const { data: themes, loading } = useAsync(api.entretiens);
  const [themeId, setThemeId] = useState('frequentes');
  const [ouverte, setOuverte] = useState(0);

  if (loading || !themes) return <PageSkeleton />;
  const theme = themes.find((t) => t.id === themeId);

  return (
    <>
      <PageHeader eyebrow="Porte 4" title="Préparer l’entretien" subtitle="Les questions qu’on vous posera, classées par thème, avec ce que le recruteur cherche vraiment." />

      <div className="split">
        <nav className="themes rise" aria-label="Thèmes" style={{ flex: '1 1 240px' }}>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              className="themes__item"
              aria-current={t.id === themeId ? 'true' : undefined}
              onClick={() => { setThemeId(t.id); setOuverte(0); }}
            >
              <span>{t.label}</span>
              <span className="themes__count">{t.questions.length}</span>
            </button>
          ))}
        </nav>

        <div className="stack" style={{ flex: '3 1 440px', '--gap': '14px' }}>
          <Card tone="night" className="theme-banner rise" style={{ '--i': 1 }}>
            <Swoosh />
            <div className="stack" style={{ '--gap': '6px', flex: '1 1 260px' }}>
              <h2 className="card__title">{theme.label}</h2>
              <p className="theme-banner__intro">{theme.intro}</p>
            </div>
            <Button to="/app/formation" variant="light" icon="play">Module de formation</Button>
          </Card>

          {theme.questions.map((q, i) => {
            const open = ouverte === i;
            const id = `q-${themeId}-${i}`;
            return (
              <div key={q.q} className={`accordion rise${open ? ' is-open' : ''}`} style={{ '--i': i + 2 }}>
                <button type="button" className="accordion__head" aria-expanded={open} aria-controls={id} onClick={() => setOuverte(open ? -1 : i)}>
                  <span>{q.q}</span>
                  <Icon name="plus" size={20} className="accordion__sign" />
                </button>
                <div id={id} className="accordion__body" hidden={!open}>
                  <p><strong>Ce que le recruteur cherche :</strong> {q.attendu}</p>
                  <p><strong>Conseil :</strong> {q.conseil}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
