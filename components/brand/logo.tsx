import { useTheme } from "@/lib/ui/theme";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const sizeClasses = compact ? "h-[17px] md:h-[35px]" : "h-[35px] md:h-[70px]";

  return (
    <span className={`relative inline-flex aspect-[2.83] ${sizeClasses}`} aria-label="Derivix">
      <img
        src="/derivix-logo.png"
        alt="Derivix"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out ${theme === "light" ? "opacity-100" : "opacity-0"}`}
      />
      <img
        src="/Derivix-dark-mode.png"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out ${theme === "dark" ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
