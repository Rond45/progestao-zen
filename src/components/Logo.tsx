import logoAsset from "@/assets/logo-progestao.png.asset.json";

type LogoProps = {
  className?: string;
  /** Tailwind height class, e.g. "h-8". Width is auto to keep aspect. */
  height?: string;
};

const Logo = ({ className = "", height = "h-8" }: LogoProps) => (
  <img
    src={logoAsset.url}
    alt="ProGestão+ — Sistema inteligente para barbearias e salões"
    className={`${height} w-auto object-contain select-none ${className}`}
    draggable={false}
  />
);

export default Logo;
