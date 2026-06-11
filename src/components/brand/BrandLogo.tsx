// src/components/brand/BrandLogo.tsx

import Image from "next/image";
import Link from "next/link";
import { COMPANY } from "@/brand";

type BrandLogoVariant = "app-light" | "app-dark" | "premium-light" | "premium-dark";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  href?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
};

const LOGO_BY_VARIANT: Record<BrandLogoVariant, string> = {
  "app-light": "/brand/logo-claro.png",
  "app-dark": "/brand/logo-escuro.png",
  "premium-light": "/brand/logo-premium-claro.png",
  "premium-dark": "/brand/logo-premium-escuro.png",
};

export function BrandLogo({
  variant = "app-light",
  href = "/",
  width = 220,
  height = 72,
  priority = false,
  className = "",
}: BrandLogoProps) {
  const logo = (
    <Image
      src={LOGO_BY_VARIANT[variant]}
      alt={COMPANY.name}
      width={width}
      height={height}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
    />
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} aria-label={COMPANY.name} className="inline-flex">
      {logo}
    </Link>
  );
}