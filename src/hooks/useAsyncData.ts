import { useEffect, useState } from "react";

type AsyncDataState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  options?: {
    enabled?: boolean;
    missingDependencyMessage?: string;
  },
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(options?.enabled ?? true));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const enabled = options?.enabled ?? true;

    const run = async () => {
      if (!enabled) {
        setData(null);
        setError(options?.missingDependencyMessage ?? "");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await loader();
        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setData(null);
          setError(err instanceof Error ? err.message : "Unable to load data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error };
}
