import { UtensilsCrossed } from "lucide-react";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`logo ${dark ? "logo-dark" : ""}`}>
      <span className="logo-mark">
        <UtensilsCrossed size={22} />
      </span>
      <strong>Menufy</strong>
    </div>
  );
}
