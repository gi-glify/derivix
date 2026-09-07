export function Logo({ compact = false }: { compact?: boolean }) {
  const heightClasses = compact 
    ? "h-[17px] md:h-[35px]" 
    : "h-[35px] md:h-[70px]";

  return (
    <img
      src="/derivix-logo.png"
      alt="Derivix Logo"
      className={`w-auto object-contain ${heightClasses}`}
    />
  );
}
