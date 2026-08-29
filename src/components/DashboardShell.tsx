import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  LogOut,
  Menu,
  Package,
  Palette,
  QrCode,
  ShieldCheck,
  Tags,
  X
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { supabase } from "../lib/supabase";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDevAdmin, setIsDevAdmin] = useState(false);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  const navItems = useMemo(() => [
    {
      to: "/dashboard",
      label: "Visão geral",
      shortLabel: "Início",
      icon: BarChart3
    },
    {
      to: "/dashboard/categorias",
      label: "Categorias",
      shortLabel: "Categorias",
      icon: Tags
    },
    {
      to: "/dashboard/produtos",
      label: "Produtos",
      shortLabel: "Produtos",
      icon: Package
    },
    {
      to: "/dashboard/aparencia",
      label: "Aparência",
      shortLabel: "Aparência",
      icon: Palette
    },
    {
      to: "/dashboard/qrcode",
      label: "QR Code",
      shortLabel: "QR",
      icon: QrCode
    }
  ], []);

  const active = (path: string) => location.pathname === path;

  const currentPage = location.pathname === "/dev"
    ? "Admin Dev"
    : navItems.find((item) => active(item.to))?.label || "Painel";


  useEffect(() => {
    const checkDevAdmin = async () => {
      const client = supabase;
      if (!client) return;

      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return;

      const { data } = await client
        .from("dev_admins")
        .select("user_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      setIsDevAdmin(Boolean(data));
    };

    checkDevAdmin();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.classList.add("mobile-menu-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <Logo dark />

        <nav>
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} className={active(to) ? "active" : ""} to={to}>
              <Icon size={19} />
              {label}
            </Link>
          ))}

          {isDevAdmin && (
            <Link className={active("/dev") ? "active dev-admin-link" : "dev-admin-link"} to="/dev">
              <ShieldCheck size={19} />
              Admin Dev
            </Link>
          )}

          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>

      <header className="dashboard-mobile-header">
        <div className="mobile-header-brand">
          <Logo />
          <span className="mobile-page-name">{currentPage}</span>
        </div>

        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={23} />
        </button>
      </header>

      {mobileOpen && (
        <>
          <button
            className="mobile-drawer-overlay"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="mobile-dashboard-drawer" aria-label="Menu do painel">
            <div className="mobile-drawer-head">
              <Logo />
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mobile-drawer-label">Gerenciar negócio</div>

            <nav className="mobile-dashboard-nav">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} className={active(to) ? "active" : ""} to={to}>
                  <span className="mobile-nav-icon">
                    <Icon size={20} />
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {isDevAdmin && (
              <Link
                to="/dev"
                className={active("/dev") ? "mobile-dev-admin-link active" : "mobile-dev-admin-link"}
              >
                <ShieldCheck size={20} />
                <span>Admin Dev</span>
              </Link>
            )}

            <div className="mobile-drawer-footer">
              <button type="button" onClick={logout}>
                <LogOut size={19} />
                Sair da conta
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="dashboard-main">{children}</main>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {navItems.map(({ to, shortLabel, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={active(to) ? "active" : ""}
            aria-current={active(to) ? "page" : undefined}
          >
            <span className="mobile-bottom-icon">
              <Icon size={20} />
            </span>
            <span>{shortLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
