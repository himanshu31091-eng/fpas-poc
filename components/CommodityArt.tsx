"use client";

import { useState } from "react";
import { IconHorseshoe, IconPaw, IconBox } from "./icons";

type Kind = "horse" | "companion" | "other";

function kindOf(commodity?: string): Kind {
  const s = (commodity ?? "").toLowerCase();
  if (/horse|equine|mare|stallion|foal|colt|filly|gelding/.test(s)) return "horse";
  if (/dog|cat|companion|pet|puppy|kitten|canine|feline/.test(s)) return "companion";
  return "other";
}

const ICON: Record<Kind, (p: { width?: number; height?: number }) => JSX.Element> = {
  horse: IconHorseshoe,
  companion: IconPaw,
  other: IconBox,
};

/**
 * Commodity thumbnail. Shows an on-brand illustration tile by default, and
 * auto-upgrades to a real photo if one exists at /animals/{kind}.jpg — so the
 * demo stays offline now, and photos appear the moment they're dropped in.
 */
export function CommodityArt({
  commodity,
  size = 40,
  className = "",
}: {
  commodity?: string;
  size?: number;
  className?: string;
}) {
  const kind = kindOf(commodity);
  const Icon = ICON[kind];
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft text-primary ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} />
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/animals/${kind}.jpg`}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
  );
}
