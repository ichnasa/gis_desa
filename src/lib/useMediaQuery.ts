import { useSyncExternalStore } from "react";

// Pantau media query CSS (mis. lebar layar) dan render ulang saat berubah
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Sama dengan breakpoint `md` Tailwind (768px)
export const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
