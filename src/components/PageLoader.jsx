import { asset } from '../config.js';
import { useLang } from '../i18n.jsx';

export default function PageLoader() {
  const { t } = useLang();
  return (
    <div className="page-loader" role="status">
      <img src={asset("logo.png")} alt="" width="56" height="56" className="page-loader__logo" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
