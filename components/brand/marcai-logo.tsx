import Image from "next/image";

type MarcaiLogoProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function MarcaiLogo({ variant = "dark", className }: MarcaiLogoProps) {
  const src = variant === "light" ? "/brand/logo-light.svg" : "/brand/logo-dark.svg";

  return (
    <Image
      src={src}
      alt="Marcai"
      width={186}
      height={42}
      unoptimized
      className={className}
    />
  );
}
