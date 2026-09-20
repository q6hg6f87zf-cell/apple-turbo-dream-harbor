import { itemArt, itemThumbUrl } from "@/game/item-art";
import type { AmmoType, ItemKind, WeaponFamily } from "@/game/types";
import { cn } from "@/lib/cn";
import { Crosshair, Disc, Gem, Package, Shield, Sparkles, Syringe, Wrench } from "lucide-react";

const KIND_ICON: Record<ItemKind, typeof Shield> = {
  weapon: Crosshair,
  armor: Shield,
  trinket: Gem,
  consumable: Syringe,
  enchantment: Sparkles,
  attachment: Wrench,
  material: Package,
  special: Disc,
};

export function ItemThumb({
  kind,
  name,
  ammoType,
  weaponFamily,
  size = "md",
  className,
}: {
  kind: ItemKind;
  name: string;
  ammoType?: AmmoType;
  weaponFamily?: WeaponFamily;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const src = itemArt({ kind, name, ammoType, weaponFamily });
  const shown = size === "hero" ? src : itemThumbUrl(src);
  const Icon = KIND_ICON[kind] ?? Package;
  const box =
    size === "hero"
      ? "h-[min(38dvh,18rem)] w-full min-w-0 max-w-full rounded-none md:h-72"
      : size === "lg"
        ? "size-14"
        : size === "sm"
          ? "size-10"
          : "size-12";
  const glyph = size === "hero" ? "size-10" : size === "lg" ? "size-6" : "size-5";
  return (
    <span
      className={cn(
        "relative flex shrink-0 overflow-hidden bg-ink shadow-[inset_0_0_0_1px_var(--color-line)]",
        size === "hero" ? "rounded-none" : "rounded-[var(--radius-md)]",
        box,
        className,
      )}
      data-item-hero={size === "hero" ? "1" : undefined}
    >
      {shown ? (
        <img
          src={shown}
          alt=""
          draggable={false}
          loading={size === "hero" ? "eager" : "lazy"}
          decoding="async"
          className={cn("size-full max-w-full", size === "hero" ? "object-contain p-3" : "object-cover")}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-ember">
          <Icon className={glyph} />
        </span>
      )}
    </span>
  );
}
