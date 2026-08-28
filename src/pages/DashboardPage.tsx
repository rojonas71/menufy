import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Radio } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { InstallAppButton } from "../components/InstallAppButton";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  status: "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";
  total: number;
  created_at: string;
};

type OwnedBusiness = {
  id: string;
  name: string;
  slug: string;
};

const statusLabel: Record<Order["status"], string> = {
  new: "Novo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  out_for_delivery: "Saiu para entrega",
  completed: "Finalizado",
  cancelled: "Cancelado"
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<OwnedBusiness | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");
  const [flashOrderId, setFlashOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase não configurado.");
      setConnection("offline");
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id,name,slug")
        .eq("owner_id", authData.user.id)
        .limit(1)
        .maybeSingle();

      if (businessError) {
        setMessage(businessError.message);
        setLoading(false);
        return;
      }

      if (!businessData) {
        navigate("/onboarding", { replace: true });
        return;
      }

      setBusiness(businessData as OwnedBusiness);

      const { data: orderData, error: ordersError } = await supabase
        .from("orders")
        .select("id,order_number,customer_name,status,total,created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ordersError) setMessage(ordersError.message);
      else setOrders((orderData ?? []) as Order[]);

      setLoading(false);
    };

    load();
  }, [navigate]);

  useEffect(() => {
    if (!supabase || !business?.id) return;

    const channel = supabase
      .channel(`dashboard-orders:${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${business.id}`
        },
        (payload) => {
          const next = payload.new as Order;
          setOrders((current) => [next, ...current.filter((o) => o.id !== next.id)].slice(0, 50));
          setFlashOrderId(next.id);

          window.setTimeout(() => {
            setFlashOrderId((current) => current === next.id ? null : current);
          }, 3500);

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Novo pedido recebido 🍽️", {
              body: `Pedido #${next.order_number} — ${next.customer_name} — ${formatBRL(Number(next.total))}`
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${business.id}`
        },
        (payload) => {
          const next = payload.new as Order;
          setOrders((current) => current.map((o) => o.id === next.id ? next : o));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("offline");
        else setConnection("connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const validOrders = orders.filter((o) => o.status !== "cancelled");

  const totalSales = useMemo(
    () => validOrders.reduce((sum, o) => sum + Number(o.total), 0),
    [orders]
  );

  const ticket = validOrders.length ? totalSales / validOrders.length : 0;

  if (loading) {
    return <main className="empty-state"><h2>Carregando painel...</h2></main>;
  }

  if (!business) {
    return <main className="empty-state"><h2>{message || "Estabelecimento não encontrado."}</h2></main>;
  }

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <div className="dashboard-live-line">
            <span className="eyebrow">Painel</span>
            <span className={`realtime-badge ${connection}`}>
              <Radio size={13} />
              {connection === "live" ? "Tempo real ativo" : connection === "connecting" ? "Conectando..." : "Offline"}
            </span>
          </div>
          <h1>{business.name}</h1>
        </div>

        <div className="dashboard-header-actions">
          <InstallAppButton compact />
          <Link className="button button-outline" to={`/menu/${business.slug}`}>
          Ver cardápio <ExternalLink size={17} />
          </Link>
        </div>
      </header>

      {message && <div className="form-message">{message}</div>}

      <section className="stat-grid">
        <article>
          <span>Pedidos</span>
          <strong>{orders.length}</strong>
          <small>Pedidos carregados</small>
        </article>
        <article>
          <span>Vendas estimadas</span>
          <strong>{formatBRL(totalSales)}</strong>
          <small>Pedidos não cancelados</small>
        </article>
        <article>
          <span>Ticket médio</span>
          <strong>{formatBRL(ticket)}</strong>
          <small>Pedidos válidos</small>
        </article>
        <article>
          <span>Conexão</span>
          <strong>{connection === "live" ? "Online" : connection === "connecting" ? "..." : "Offline"}</strong>
          <small>Supabase Realtime</small>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Pedidos em tempo real</h2>
            <p>Novos pedidos aparecem automaticamente.</p>
          </div>
        </div>

        <div className="order-table">
          {orders.map((order) => (
            <div
              className={`order-row ${flashOrderId === order.id ? "order-row-new" : ""}`}
              key={order.id}
            >
              <strong>#{order.order_number}</strong>
              <span>{order.customer_name}</span>
              <span className={`status status-${order.status}`}>{statusLabel[order.status]}</span>
              <strong>{formatBRL(Number(order.total))}</strong>
            </div>
          ))}

          {!orders.length && <div className="empty-state">Nenhum pedido recebido ainda.</div>}
        </div>
      </section>
    </DashboardShell>
  );
}
