import { useEffect, useState } from 'react';

// Charge une ressource asynchrone et expose { data, error, loading }.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    let actif = true;
    setState((s) => ({ ...s, loading: true }));
    loader()
      .then((data) => actif && setState({ data, error: null, loading: false }))
      .catch((error) => actif && setState({ data: null, error, loading: false }));
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
