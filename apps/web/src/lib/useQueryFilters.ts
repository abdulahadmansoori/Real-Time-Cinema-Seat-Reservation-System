"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps filter/pagination state in the URL search params so refresh/share preserves them.
 */
export function useQueryFilters(defaults: Record<string, string> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const values = useMemo(() => {
    const next: Record<string, string> = { ...defaultsRef.current };
    searchParams.forEach((v, k) => {
      next[k] = v;
    });
    return next;
  }, [searchParams]);

  const setValue = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete(key);
      else params.set(key, value);
      if (key !== "page") params.set("page", "1");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setMany = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const page = Number(values.page || "1") || 1;
  const pageSize = Number(values.pageSize || "20") || 20;

  return { values, setValue, setMany, page, pageSize };
}
