'use client';

import { useEffect, useState } from 'react';

/** Hora actual que se refresca cada `intervalMs` (para textos tipo "visto hace X s"). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
