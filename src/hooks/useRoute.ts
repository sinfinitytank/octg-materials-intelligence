import { useEffect, useState } from 'react';
export function navigate(path: string) {
  window.location.hash = path;
}
export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => {
      setHash(window.location.hash.slice(1) || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const [path, search] = hash.split('?');
  return { path, params: new URLSearchParams(search) };
}
