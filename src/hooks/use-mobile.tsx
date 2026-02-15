import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const getInitialValue = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    ).matches;
  };

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Initial sync (covers Safari edge cases)
    setIsMobile(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }

    // Fallback for older browsers
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return isMobile;
}
