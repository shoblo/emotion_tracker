import { useCallback, useEffect, useState } from "react";
import { loadAllEntries } from "./history";
import type { HistoryEntry } from "./stats";

export function useEntries() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setError(null);
    loadAllEntries()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the history."));
  }, []);

  useEffect(reload, [reload]);
  return { entries, error, reload };
}
