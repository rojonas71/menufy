import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Package,
  Plus,
  Radio,
  RefreshCw,
  ShoppingBag,
  Tags,
  TrendingUp
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { InstallAppButton } from "../components/InstallAppButton";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Status = "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  status: Status;
  total: number;
  created_at: string;
};

type OwnedBusiness = {
  id: string;
  name: string;
  slug: string;
  is_open?: boolean;
};

const statusLabel: Record<Status, string> = {
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
  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [activeProductCount, setActiveProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");
  const [flashOrderId, setFlashOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const client = supabase;
    if (!client) {
      setMessage("Supabase não configurado.");
      setConnection("offline");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: authData } = await client.auth.getUser();

    if (!authData.user) {
      navigate("/login", { replace: true });
      return;
    }

    const { data: businessData, error: businessError } = await client
      .from("businesses")
      .select("id,name,slug,is_open")
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

    const [ordersResult, categoriesResult, productsResult, activeProductsResult] = await Promise.all([
      client
        .from("orders")
        .select("id,order_number,customer_name,status,total,created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessData.id),
      client
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessData.id),
      client
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessData.id)
        .eq("is_active", true)
    ]);

    if (ordersResult.error) setMessage(ordersResult.error.message);
    else setOrders((ordersResult.data ?? []) as Order[]);

    setCategoryCount(categoriesResult.count ?? 0);
    setProductCount(productsResult.count ?? 0);
    setActiveProductCount(activeProductsResult.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [navigate]);

  useEffect(() => {
    const client = supabase;
    if (!client || !business?.id) return;

    const channel = client
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
          setOrders((current) => [next, ...current.filter((o) => o.id !== next.id)].slice(0, 100));
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
      client.removeChannel(channel);
    };
  }, [business?.id]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const todayKey = new Date().toLocaleDateString("pt-BR");

  const todayOrders = useMemo(
    () => orders.filter((order) => new Date(order.created_at).toLocaleDateString("pt-BR") === todayKey),
    [orders, todayKey]
  );

  const validTodayOrders = todayOrders.filter((order) => order.status !== "cancelled");
  const todayRevenue = validTodayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const todayTicket = validTodayOrders.length ? todayRevenue / validTodayOrders.length : 0;

  const inProgress = orders.filter((order) =>
    ["new", "confirmed", "preparing", "out_for_delivery"].includes(order.status)
  ).length;

  const completedToday = todayOrders.filter((order) => order.status === "completed").length;
  const recentOrders = orders.slice(0, 8);

  if (loading) {
    return <main className="empty-state"><h2>Carregando painel...</h2></main>;
  }

  if (!business) {
    return <main className="empty-state"><h2>{message || "Estabelecimento não encontrado."}</h2></main>;
  }

  return (
    <DashboardShell>
      <header className="dashboard-header dashboard-overview-header">
        <div>
          <div className="dashboard-live-line">
            <span className="eyebrow">Visão geral</span>
            <span className={`realtime-badge ${connection}`}>
              <Radio size={13} />
              {connection === "live" ? "Tempo real ativo" : connection === "connecting" ? "Conectando..." : "Offline"}
            </span>
          </div>

          <h1>{business.name}</h1>
          <p className="dashboard-subtitle">
            Acompanhe sua operação, cardápio e pedidos em um só lugar.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button className="button button-outline" onClick={load}>
            <RefreshCw size={17} /> Atualizar
          </button>
          <InstallAppButton compact />
          <Link className="button" to={`/menu/${business.slug}`}>
            Ver cardápio <ExternalLink size={17} />
          </Link>
        </div>
      </header>

      {message && <div className="form-message">{message}</div>}

      <section className="overview-kpi-grid">
        <article>
          <span className="overview-kpi-icon"><ShoppingBag size={19} /></span>
          <div>
            <small>Pedidos hoje</small>
            <strong>{todayOrders.length}</strong>
            <span>{inProgress} em andamento</span>
          </div>
        </article>

        <article>
          <span className="overview-kpi-icon"><TrendingUp size={19} /></span>
          <div>
            <small>Volume hoje</small>
            <strong>{formatBRL(todayRevenue)}</strong>
            <span>Pedidos não cancelados</span>
          </div>
        </article>

        <article>
          <span className="overview-kpi-icon"><Clock3 size={19} /></span>
          <div>
            <small>Ticket médio hoje</small>
            <strong>{formatBRL(todayTicket)}</strong>
            <span>{validTodayOrders.length} pedidos válidos</span>
          </div>
        </article>

        <article>
          <span className="overview-kpi-icon"><CheckCircle2 size={19} /></span>
          <div>
            <small>Finalizados hoje</small>
            <strong>{completedToday}</strong>
            <span>Pedidos concluídos</span>
          </div>
        </article>
      </section>

      <section className="overview-health-grid">
        <article className="overview-health-card">
          <div className="overview-health-head">
            <div>
              <span className="eyebrow">Cardápio</span>
              <h2>Saúde do catálogo</h2>
            </div>
            <Boxes size={20} />
          </div>

          <div className="overview-health-stats">
            <div><strong>{categoryCount}</strong><span>Categorias</span></div>
            <div><strong>{productCount}</strong><span>Produtos</span></div>
            <div><strong>{activeProductCount}</strong><span>Ativos</span></div>
          </div>

          <div className="overview-progress">
            <span>
              <i
                style={{
                  width: `${productCount ? Math.round((activeProductCount / productCount) * 100) : 0}%`
                }}
              />
            </span>
            <small>
              {productCount
                ? `${Math.round((activeProductCount / productCount) * 100)}% dos produtos estão visíveis`
                : "Cadastre seus primeiros produtos"}
            </small>
          </div>

          <div className="overview-health-actions">
            <Link to="/dashboard/categorias"><Tags size={15} /> Categorias</Link>
            <Link to="/dashboard/produtos"><Package size={15} /> Produtos</Link>
          </div>
        </article>

        <article className="overview-health-card">
          <div className="overview-health-head">
            <div>
              <span className="eyebrow">Ações rápidas</span>
              <h2>Gerencie mais rápido</h2>
            </div>
            <Plus size={20} />
          </div>

          <div className="overview-quick-actions">
            <Link to="/dashboard/produtos">
              <Package size={18} />
              <div><strong>Novo produto</strong><span>Adicione itens ao cardápio</span></div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/dashboard/pedidos">
              <ShoppingBag size={18} />
              <div><strong>Ver pedidos</strong><span>Acompanhe a operação</span></div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/dashboard/aparencia">
              <Boxes size={18} />
              <div><strong>Aparência e operação</strong><span>Cores, entrega e disponibilidade</span></div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Tempo real</span>
            <h2>Pedidos recentes</h2>
            <p>Os pedidos novos aparecem automaticamente.</p>
          </div>

          <Link className="button button-outline" to="/dashboard/pedidos">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="order-table overview-order-table">
          {recentOrders.map((order) => (
            <div
              className={`order-row ${flashOrderId === order.id ? "order-row-new" : ""}`}
              key={order.id}
            >
              <div>
                <strong>#{order.order_number}</strong>
                <small>{new Date(order.created_at).toLocaleString("pt-BR")}</small>
              </div>
              <span>{order.customer_name}</span>
              <span className={`status status-${order.status}`}>{statusLabel[order.status]}</span>
              <strong>{formatBRL(Number(order.total))}</strong>
            </div>
          ))}

          {!recentOrders.length && (
            <div className="empty-state">
              Nenhum pedido recebido ainda. Seu próximo pedido aparecerá aqui.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
