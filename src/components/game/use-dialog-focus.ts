import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Move focus into a full-screen surface when it opens and hand it back when it
 * closes, so a keyboard or switch user is not left behind on the screen the
 * sheet covered.
 */
export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    first?.focus?.({ preventScroll: true });
    return () => {
      if (opener && document.contains(opener)) opener.focus?.({ preventScroll: true });
    };
  }, []);

  return ref;
}
