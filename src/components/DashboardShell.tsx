import {
  BarChart3,
  LogOut,
  Package,
  QrCode,
  Tags,
  Palette
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { supabase } from "../lib/supabase";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const active = (path: string) => location.pathname === path;

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <Logo dark />

        <nav>
          <Link className={active("/dashboard") ? "active" : ""} to="/dashboard">
            <BarChart3 size={19} /> Visão geral
          </Link>

          <Link className={active("/dashboard/categorias") ? "active" : ""} to="/dashboard/categorias">
            <Tags size={19} /> Categorias
          </Link>

          <Link className={active("/dashboard/produtos") ? "active" : ""} to="/dashboard/produtos">
            <Package size={19} /> Produtos
          </Link>

          <Link className={active("/dashboard/aparencia") ? "active" : ""} to="/dashboard/aparencia">
            <Palette size={19} /> Aparência
          </Link>

          <Link className={active("/dashboard/qrcode") ? "active" : ""} to="/dashboard/qrcode">
            <QrCode size={19} /> QR Code
          </Link>

          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={18} /> Sair
          </button>
        </nav>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
