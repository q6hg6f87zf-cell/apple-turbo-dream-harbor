import { useEffect } from "react";
import { CLASS_PRESENTATION } from "@/game/presentation";
import type { ClassName } from "@/game/types";

const OLD_NAMES = Object.keys(CLASS_PRESENTATION) as ClassName[];
const RE = new RegExp(`\\b(${OLD_NAMES.join("|")})\\b`, "g");

function replaceText(node: Text) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script,style,textarea,input,select,option")) return;
  const before = node.nodeValue ?? "";
  if (!RE.test(before)) {
    RE.lastIndex = 0;
    return;
  }
  RE.lastIndex = 0;
  const after = before.replace(RE, (raw) => {
    const meta = CLASS_PRESENTATION[raw as ClassName];
    return meta ? `${meta.emoji} ${meta.name}` : raw;
  });
  if (after !== before) node.nodeValue = after;
}

function scan(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    replaceText(root as Text);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    replaceText(current as Text);
    current = walker.nextNode();
  }
}

/**
 * Presentation-only migration layer.
 *
 * The engine and save files deliberately keep the original class keys so old
 * saves remain valid. This layer makes every legacy screen speak the current
 * Hollow Realm class language until each legacy view is retired/refactored.
 */
export function ClassAliasLayer() {
  useEffect(() => {
    scan(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") replaceText(mutation.target as Text);
        for (const node of mutation.addedNodes) scan(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
