import { useCallback, useEffect, useRef, useState } from 'react';

// Charge une ressource asynchrone et expose { data, error, loading, recharger, setData }.
// `recharger()` relance le chargement sans afficher de squelette (données gardées à l'écran).
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const actif = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const charger = useCallback(() => {
    return loaderRef.current()
      .then((data) => actif.current && setState({ data, error: null, loading: false }))
      .catch((error) => actif.current && setState((s) => ({ data: s.data, error, loading: false })));
  }, []);

  useEffect(() => {
    actif.current = true;
    setState((s) => ({ ...s, loading: true }));
    charger();
    return () => {
      actif.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((f) => setState((s) => ({ ...s, data: typeof f === 'function' ? f(s.data) : f })), []);
  return { ...state, recharger: charger, setData };
}
