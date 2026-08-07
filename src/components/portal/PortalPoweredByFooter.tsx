import { BrandLogo } from "@/components/brand/BrandLogo";

export function PortalPoweredByFooter() {
  return (
    <footer className="mt-10 border-t border-white/[0.04] pt-6 text-center">
      <p className="flex items-center justify-center gap-2 text-xs text-gray-600">
        <span>Powered by</span>
        <BrandLogo size="xs" className="opacity-80" />
      </p>
    </footer>
  );
}
