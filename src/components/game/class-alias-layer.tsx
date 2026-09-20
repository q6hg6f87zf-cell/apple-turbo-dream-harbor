import { useEffect } from "react";
import { CLASS_PRESENTATION } from "@/game/presentation";
import { LEGACY_LINEAGE_MAP, LEGACY_RACE_MAP } from "@/game/data-legacy";
import type { ClassName } from "@/game/types";

const CLASS_NAMES = Object.keys(CLASS_PRESENTATION) as ClassName[];
const CLASS_RE = new RegExp(`\\b(${CLASS_NAMES.join("|")})\\b`, "g");
const RACE_KEYS = Object.keys(LEGACY_RACE_MAP).sort((a, b) => b.length - a.length);
const LINEAGE_KEYS = Object.keys(LEGACY_LINEAGE_MAP).sort((a, b) => b.length - a.length);
const LORE_RE = new RegExp(
  `\\b(${[...RACE_KEYS, ...LINEAGE_KEYS].map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "g",
);

function replaceText(node: Text) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script,style,textarea,input,select,option")) return;
  const before = node.nodeValue ?? "";
  CLASS_RE.lastIndex = 0;
  LORE_RE.lastIndex = 0;
  let after = before;
  if (CLASS_RE.test(after)) {
    CLASS_RE.lastIndex = 0;
    after = after.replace(CLASS_RE, (raw) => CLASS_PRESENTATION[raw as ClassName]?.name ?? raw);
  }
  if (LORE_RE.test(after)) {
    LORE_RE.lastIndex = 0;
    after = after.replace(LORE_RE, (raw) => LEGACY_RACE_MAP[raw] ?? LEGACY_LINEAGE_MAP[raw] ?? raw);
  }
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
 * Engine keys stay Warrior / Wizard / etc. Player-facing chrome speaks Ironbound,
 * Riftwright, and the Hollow Realm bloodlines.
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
