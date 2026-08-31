import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  ChevronRight,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UsersRound,
  WalletCards
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type AdminTab = "overview" | "businesses" | "orders" | "users";
type Plan = "starter" | "pro" | "premium";
type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";
type OrderStatus = "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

type BusinessRow = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  whatsapp: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at?: string | null;
};

type OrderRow = {
  id: string;
  order_number: number;
  business_id: string;
  business_name: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  order_type: string;
  payment_method: string;
  total: number;
  created_at: string;
};

type UserRow = {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  business_count: number;
};

type Metrics = {
  businesses_total: number;
  businesses_active: number;
  businesses_inactive: number;
  plan_starter: number;
  plan_pro: number;
  plan_premium: number;
  subscriptions_active: number;
  subscriptions_trial: number;
  subscriptions_past_due: number;
  subscriptions_cancelled: number;
  owners_total: number;
  orders_total: number;
  orders_today: number;
  orders_7d: number;
  orders_30d: number;
  revenue_total: number;
  revenue_30d: number;
  average_ticket: number;
};

const planLabel: Record<Plan, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium"
};

const subscriptionLabel: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  trial: "Teste",
  past_due: "Pendente",
  cancelled: "Cancelada"
};

const orderStatusLabel: Record<OrderStatus, string> = {
  new: "Novo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  out_for_delivery: "Saiu para entrega",
  completed: "Finalizado",
  cancelled: "Cancelado"
};

const emptyMetrics: Metrics = {
  businesses_total: 0,
  businesses_active: 0,
  businesses_inactive: 0,
  plan_starter: 0,
  plan_pro: 0,
  plan_premium: 0,
  subscriptions_active: 0,
  subscriptions_trial: 0,
  subscriptions_past_due: 0,
  subscriptions_cancelled: 0,
  owners_total: 0,
  orders_total: 0,
  orders_today: 0,
  orders_7d: 0,
  orders_30d: 0,
  revenue_total: 0,
  revenue_30d: 0,
  average_ticket: 0
};

function dateBR(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);

  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DevAdminPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [businessSearch, setBusinessSearch] = useState("");
  const [businessPlanFilter, setBusinessPlanFilter] = useState<"all" | Plan>("all");
  const [businessStatusFilter, setBusinessStatusFilter] = useState<"all" | SubscriptionStatus>("all");
  const [businessActiveFilter, setBusinessActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [businessSort, setBusinessSort] = useState<"newest" | "name" | "orders" | "revenue">("newest");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");

  const [userSearch, setUserSearch] = useState("");

  const load = async () => {
    const client = supabase;

    if (!client) {
      setMessage("Supabase não configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: auth } = await client.auth.getUser();

    if (!auth.user) {
      navigate("/login", { replace: true });
      return;
    }

    const { data: adminRow, error: adminError } = await client
      .from("dev_admins")
      .select("user_id,email")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (adminError) {
      setMessage(
        "Admin Dev ainda não está configurado corretamente. Execute as migrations 004, 005 e 006 no Supabase."
      );
      setAuthorized(false);
      setLoading(false);
      return;
    }

    if (!adminRow) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);

    const [
      { data: businessRows, error: businessError },
      { data: metricData, error: metricError },
      { data: orderRows, error: orderError },
      { data: userRows, error: userError }
    ] = await Promise.all([
      client
        .from("businesses")
        .select(
          "id,owner_id,name,slug,whatsapp,city,state,is_active,plan,subscription_status,created_at,updated_at"
        )
        .order("created_at", { ascending: false }),

      client.rpc("dev_admin_metrics"),

      client.rpc("dev_admin_orders", { p_limit: 500 }),

      client.rpc("dev_admin_users")
    ]);

    if (businessError) {
      setMessage(
        businessError.message.toLowerCase().includes("plan")
          ? "Execute as migrations 005_business_plans.sql e 006_global_admin.sql."
          : businessError.message
      );
    } else {
      setBusinesses((businessRows ?? []) as BusinessRow[]);
    }

    if (metricError) {
      setMessage((current) => current || "Execute a migration 006_global_admin.sql.");
    } else if (metricData) {
      setMetrics(metricData as Metrics);
    }

    if (orderError) {
      setMessage((current) => current || orderError.message);
    } else {
      setOrders((orderRows ?? []) as OrderRow[]);
    }

    if (userError) {
      setMessage((current) => current || userError.message);
    } else {
      setUsers((userRows ?? []) as UserRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateBusiness = async (
    businessId: string,
    changes: Partial<
      Pick<BusinessRow, "is_active" | "plan" | "subscription_status">
    >
  ) => {
    const client = supabase;
    if (!client) return;

    setSavingId(businessId);
    setMessage("");

    const { data, error } = await client
      .from("businesses")
      .update({
        ...changes,
        updated_at: new Date().toISOString()
      })
      .eq("id", businessId)
      .select(
        "id,owner_id,name,slug,whatsapp,city,state,is_active,plan,subscription_status,created_at,updated_at"
      )
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setBusinesses((current) =>
        current.map((business) =>
          business.id === businessId ? (data as BusinessRow) : business
        )
      );

      const { data: metricData } = await client.rpc("dev_admin_metrics");
      if (metricData) setMetrics(metricData as Metrics);
    }

    setSavingId(null);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const client = supabase;
    if (!client) return;

    setSavingId(orderId);
    setMessage("");

    const { data, error } = await client
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id,status")
      .single();

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: data.status as OrderStatus } : order
        )
      );

      const { data: metricData } = await client.rpc("dev_admin_metrics");
      if (metricData) setMetrics(metricData as Metrics);
    }

    setSavingId(null);
  };

  const filteredBusinesses = useMemo(() => {
    const term = businessSearch.trim().toLowerCase();

    const filtered = businesses.filter((business) => {
      const ownerEmail = users.find((user) => user.user_id === business.owner_id)?.email || "";
      const matchesText =
        !term ||
        [
          business.name,
          business.slug,
          business.whatsapp,
          business.city || "",
          business.state || "",
          ownerEmail
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesPlan =
        businessPlanFilter === "all" || business.plan === businessPlanFilter;

      const matchesStatus =
        businessStatusFilter === "all" ||
        business.subscription_status === businessStatusFilter;

      const matchesActive =
        businessActiveFilter === "all" ||
        (businessActiveFilter === "active" ? business.is_active : !business.is_active);

      return matchesText && matchesPlan && matchesStatus && matchesActive;
    });

    return [...filtered].sort((a, b) => {
      if (businessSort === "name") return a.name.localeCompare(b.name, "pt-BR");

      const ordersA = orders.filter((order) => order.business_id === a.id);
      const ordersB = orders.filter((order) => order.business_id === b.id);

      if (businessSort === "orders") return ordersB.length - ordersA.length;
      if (businessSort === "revenue") {
        const revenueA = ordersA.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0);
        const revenueB = ordersB.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0);
        return revenueB - revenueA;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    businesses,
    users,
    orders,
    businessSearch,
    businessPlanFilter,
    businessStatusFilter,
    businessActiveFilter,
    businessSort
  ]);

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesText =
        !term ||
        [
          order.order_number,
          order.business_name,
          order.customer_name,
          order.customer_phone
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        orderStatusFilter === "all" || order.status === orderStatusFilter;

      return matchesText && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) =>
      [user.email, user.user_id]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [users, userSearch]);

  const planTotal =
    metrics.plan_starter + metrics.plan_pro + metrics.plan_premium || 1;

  const subscriptionTotal =
    metrics.subscriptions_active +
      metrics.subscriptions_trial +
      metrics.subscriptions_past_due +
      metrics.subscriptions_cancelled || 1;

  if (loading) {
    return (
      <main className="empty-state">
        <h2>Carregando Administração global...</h2>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="dev-access-page">
        <div className="dev-access-card">
          <ShieldCheck size={46} />
          <span className="eyebrow">Administração global</span>
          <h1>{message ? "Admin Dev não configurado" : "Acesso restrito"}</h1>
          <p>
            {message ||
              "Esta área é exclusiva do administrador de desenvolvimento autorizado."}
          </p>

          <div className="dev-access-actions">
            <Link className="button" to="/dashboard">
              Voltar ao painel
            </Link>
            <button
              className="button button-outline"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-header global-admin-header">
        <div>
          <span className="eyebrow">Administração global</span>
          <h1>Central da plataforma</h1>
          <p className="dashboard-subtitle">
            Controle estabelecimentos, usuários, pedidos, planos e indicadores do Menufy.
          </p>
        </div>

        <button className="button button-outline" onClick={load}>
          <RefreshCw size={17} /> Atualizar dados
        </button>
      </header>

      {message && <div className="form-message">{message}</div>}

      <nav className="global-admin-tabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          <BarChart3 size={18} />
          Visão geral
        </button>

        <button
          className={tab === "businesses" ? "active" : ""}
          onClick={() => setTab("businesses")}
        >
          <Building2 size={18} />
          Estabelecimentos
          <span>{metrics.businesses_total}</span>
        </button>

        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          <ShoppingBag size={18} />
          Pedidos
          <span>{metrics.orders_total}</span>
        </button>

        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
          <UsersRound size={18} />
          Usuários
          <span>{users.length}</span>
        </button>
      </nav>

      {tab === "overview" && (
        <>
          <section className="stat-grid global-stat-grid">
            <article>
              <span>Estabelecimentos</span>
              <strong>{metrics.businesses_total}</strong>
              <small>{metrics.businesses_active} ativos</small>
            </article>

            <article>
              <span>Pedidos hoje</span>
              <strong>{metrics.orders_today}</strong>
              <small>{metrics.orders_7d} nos últimos 7 dias</small>
            </article>

            <article>
              <span>Volume 30 dias</span>
              <strong>{formatBRL(Number(metrics.revenue_30d))}</strong>
              <small>{metrics.orders_30d} pedidos</small>
            </article>

            <article>
              <span>Ticket médio</span>
              <strong>{formatBRL(Number(metrics.average_ticket))}</strong>
              <small>Pedidos não cancelados</small>
            </article>
          </section>

          <div className="global-overview-grid">
            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2><WalletCards size={20} /> Distribuição dos planos</h2>
                  <p>Quantidade de estabelecimentos por plano.</p>
                </div>
              </div>

              <div className="metric-bars">
                {[
                  ["Starter", metrics.plan_starter, "starter"],
                  ["Pro", metrics.plan_pro, "pro"],
                  ["Premium", metrics.plan_premium, "premium"]
                ].map(([label, value, key]) => (
                  <div className="metric-bar-row" key={String(key)}>
                    <div className="metric-bar-label">
                      <span>{label}</span>
                      <strong>{Number(value)}</strong>
                    </div>
                    <div className="metric-bar-track">
                      <span
                        className={`metric-bar-fill ${key}`}
                        style={{
                          width: `${Math.max(
                            4,
                            (Number(value) / planTotal) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h2><CheckCircle2 size={20} /> Assinaturas</h2>
                  <p>Situação comercial dos estabelecimentos.</p>
                </div>
              </div>

              <div className="subscription-summary">
                {[
                  ["Ativas", metrics.subscriptions_active, "active"],
                  ["Teste", metrics.subscriptions_trial, "trial"],
                  ["Pendentes", metrics.subscriptions_past_due, "past_due"],
                  ["Canceladas", metrics.subscriptions_cancelled, "cancelled"]
                ].map(([label, value, key]) => (
                  <article key={String(key)}>
                    <span className={`subscription-dot ${key}`} />
                    <div>
                      <strong>{Number(value)}</strong>
                      <span>{label}</span>
                    </div>
                    <small>
                      {Math.round((Number(value) / subscriptionTotal) * 100)}%
                    </small>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="dashboard-panel dev-admin-section">
            <div className="panel-heading">
              <div>
                <h2>Resumo da plataforma</h2>
                <p>Indicadores consolidados do Menufy.</p>
              </div>
            </div>

            <div className="global-kpi-list">
              <article>
                <span>Owners cadastrados</span>
                <strong>{metrics.owners_total}</strong>
              </article>
              <article>
                <span>Pedidos totais</span>
                <strong>{metrics.orders_total}</strong>
              </article>
              <article>
                <span>Volume total</span>
                <strong>{formatBRL(Number(metrics.revenue_total))}</strong>
              </article>
              <article>
                <span>Cardápios inativos</span>
                <strong>{metrics.businesses_inactive}</strong>
              </article>
            </div>
          </section>
        </>
      )}

      {tab === "businesses" && (
        <section className="dashboard-panel dev-admin-section">
          <div className="global-toolbar">
            <div>
              <h2>Estabelecimentos</h2>
              <p>{filteredBusinesses.length} resultados</p>
            </div>

            <button
              className="button button-outline"
              onClick={() =>
                downloadCsv(
                  "menufy-estabelecimentos.csv",
                  filteredBusinesses.map((business) => ({
                    nome: business.name,
                    slug: business.slug,
                    whatsapp: business.whatsapp,
                    cidade: business.city || "",
                    estado: business.state || "",
                    plano: planLabel[business.plan],
                    proprietario: users.find((user) => user.user_id === business.owner_id)?.email || "",
                    assinatura: subscriptionLabel[business.subscription_status],
                    ativo: business.is_active ? "Sim" : "Não",
                    pedidos: orders.filter((order) => order.business_id === business.id).length,
                    volume: orders.filter((order) => order.business_id === business.id && order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0).toFixed(2),
                    criado_em: dateBR(business.created_at)
                  }))
                )
              }
            >
              <Download size={17} /> Exportar CSV
            </button>
          </div>

          <div className="business-advanced-filters">
            <label className="dev-search business-search-wide">
              <Search size={17} />
              <input
                value={businessSearch}
                onChange={(event) => setBusinessSearch(event.target.value)}
                placeholder="Buscar estabelecimento, proprietário, slug, cidade ou WhatsApp..."
              />
            </label>

            <select value={businessPlanFilter} onChange={(event) => setBusinessPlanFilter(event.target.value as "all" | Plan)}>
              <option value="all">Todos os planos</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="premium">Premium</option>
            </select>

            <select value={businessStatusFilter} onChange={(event) => setBusinessStatusFilter(event.target.value as "all" | SubscriptionStatus)}>
              <option value="all">Todas assinaturas</option><option value="active">Ativa</option><option value="trial">Teste</option><option value="past_due">Pendente</option><option value="cancelled">Cancelada</option>
            </select>

            <select value={businessActiveFilter} onChange={(event) => setBusinessActiveFilter(event.target.value as "all" | "active" | "inactive")}>
              <option value="all">Online e offline</option><option value="active">Somente online</option><option value="inactive">Somente offline</option>
            </select>

            <select value={businessSort} onChange={(event) => setBusinessSort(event.target.value as "newest" | "name" | "orders" | "revenue")}>
              <option value="newest">Mais recentes</option><option value="name">Nome A–Z</option><option value="orders">Mais pedidos</option><option value="revenue">Maior volume</option>
            </select>
          </div>

          <div className="dev-business-grid global-business-grid">
            {filteredBusinesses.map((business) => {
              const businessOrders = orders.filter((order) => order.business_id === business.id);
              const businessRevenue = businessOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0);
              const owner = users.find((user) => user.user_id === business.owner_id);

              return (
              <article className="dev-business-card business-pro-card" key={business.id}>
                <div className="dev-business-card-head">
                  <div>
                    <strong>{business.name}</strong>
                    <span>
                      {business.city || "Cidade não informada"}
                      {business.state ? `/${business.state}` : ""}
                    </span>
                  </div>

                  <span className={business.is_active ? "dev-status active" : "dev-status"}>
                    {business.is_active ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="dev-business-meta business-pro-meta">
                  <span><MapPin size={13} /> {business.city || "Cidade não informada"}{business.state ? `/${business.state}` : ""}</span>
                  <span><Phone size={13} /> {business.whatsapp}</span>
                  <span>/{business.slug}</span>
                </div>

                <div className="business-owner-line">
                  <span>Proprietário</span>
                  <strong>{owner?.email || "Não identificado"}</strong>
                </div>

                <div className="business-mini-stats">
                  <article><span>Pedidos</span><strong>{businessOrders.length}</strong></article>
                  <article><span>Volume</span><strong>{formatBRL(businessRevenue)}</strong></article>
                  <article><span>Criado</span><strong>{dateBR(business.created_at).split(" ")[0]}</strong></article>
                </div>

                <div className="dev-control-grid">
                  <label>
                    Plano
                    <select
                      value={business.plan}
                      disabled={savingId === business.id}
                      onChange={(event) =>
                        updateBusiness(business.id, {
                          plan: event.target.value as Plan
                        })
                      }
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </label>

                  <label>
                    Assinatura
                    <select
                      value={business.subscription_status}
                      disabled={savingId === business.id}
                      onChange={(event) =>
                        updateBusiness(business.id, {
                          subscription_status:
                            event.target.value as SubscriptionStatus
                        })
                      }
                    >
                      <option value="active">Ativa</option>
                      <option value="trial">Teste</option>
                      <option value="past_due">Pendente</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </label>
                </div>

                <div className="dev-business-actions">
                  <button
                    type="button"
                    className={
                      business.is_active
                        ? "button button-outline dev-disable-button"
                        : "button"
                    }
                    disabled={savingId === business.id}
                    onClick={() =>
                      updateBusiness(business.id, {
                        is_active: !business.is_active
                      })
                    }
                  >
                    {savingId === business.id
                      ? "Salvando..."
                      : business.is_active
                        ? "Desativar"
                        : "Ativar"}
                  </button>

                  <Link className="button button-outline" to={`/menu/${business.slug}`} target="_blank">
                    Abrir <ExternalLink size={16} />
                  </Link>
                  <Link className="button business-manage-button" to={`/dev/estabelecimentos/${business.id}`}>
                    Gerenciar <ChevronRight size={16} />
                  </Link>
                </div>
              </article>
              );
            })}

            {!filteredBusinesses.length && (
              <div className="empty-state">
                Nenhum estabelecimento encontrado.
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section className="dashboard-panel dev-admin-section">
          <div className="global-toolbar">
            <div>
              <h2>Pedidos globais</h2>
              <p>{filteredOrders.length} pedidos carregados</p>
            </div>

            <button
              className="button button-outline"
              onClick={() =>
                downloadCsv(
                  "menufy-pedidos.csv",
                  filteredOrders.map((order) => ({
                    pedido: order.order_number,
                    estabelecimento: order.business_name,
                    cliente: order.customer_name,
                    telefone: order.customer_phone,
                    status: orderStatusLabel[order.status],
                    tipo: order.order_type,
                    pagamento: order.payment_method,
                    total: Number(order.total).toFixed(2),
                    criado_em: dateBR(order.created_at)
                  }))
                )
              }
            >
              <Download size={17} /> Exportar CSV
            </button>
          </div>

          <div className="global-filter-row">
            <label className="dev-search">
              <Search size={17} />
              <input
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Buscar pedido, cliente ou estabelecimento..."
              />
            </label>

            <select
              value={orderStatusFilter}
              onChange={(event) =>
                setOrderStatusFilter(event.target.value as "all" | OrderStatus)
              }
            >
              <option value="all">Todos os status</option>
              <option value="new">Novo</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="out_for_delivery">Saiu para entrega</option>
              <option value="completed">Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="global-order-list">
            {filteredOrders.map((order) => (
              <article className="global-order-card" key={order.id}>
                <div className="global-order-main">
                  <div>
                    <strong>#{order.order_number}</strong>
                    <span>{order.business_name}</span>
                  </div>

                  <strong>{formatBRL(Number(order.total))}</strong>
                </div>

                <div className="global-order-details">
                  <span>{order.customer_name}</span>
                  <span>{order.customer_phone}</span>
                  <span>{dateBR(order.created_at)}</span>
                </div>

                <div className="global-order-footer">
                  <span className={`status status-${order.status}`}>
                    {orderStatusLabel[order.status]}
                  </span>

                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(event) =>
                      updateOrderStatus(
                        order.id,
                        event.target.value as OrderStatus
                      )
                    }
                  >
                    <option value="new">Novo</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="out_for_delivery">Saiu para entrega</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </article>
            ))}

            {!filteredOrders.length && (
              <div className="empty-state">Nenhum pedido encontrado.</div>
            )}
          </div>
        </section>
      )}

      {tab === "users" && (
        <section className="dashboard-panel dev-admin-section">
          <div className="global-toolbar">
            <div>
              <h2>Usuários da plataforma</h2>
              <p>{filteredUsers.length} usuários</p>
            </div>

            <button
              className="button button-outline"
              onClick={() =>
                downloadCsv(
                  "menufy-usuarios.csv",
                  filteredUsers.map((user) => ({
                    email: user.email,
                    id: user.user_id,
                    estabelecimentos: user.business_count,
                    cadastro: dateBR(user.created_at),
                    ultimo_login: dateBR(user.last_sign_in_at)
                  }))
                )
              }
            >
              <Download size={17} /> Exportar CSV
            </button>
          </div>

          <div className="global-filter-row">
            <label className="dev-search">
              <Search size={17} />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Buscar usuário por email ou ID..."
              />
            </label>
          </div>

          <div className="global-user-list">
            {filteredUsers.map((user) => (
              <article className="global-user-card" key={user.user_id}>
                <div className="global-user-avatar">
                  {(user.email || "U").charAt(0).toUpperCase()}
                </div>

                <div className="global-user-info">
                  <strong>{user.email || "Sem email"}</strong>
                  <span>{user.user_id}</span>
                </div>

                <div className="global-user-stats">
                  <span>
                    <strong>{user.business_count}</strong>
                    negócios
                  </span>

                  <span>
                    <strong>{dateBR(user.created_at)}</strong>
                    cadastro
                  </span>

                  <span>
                    <strong>{dateBR(user.last_sign_in_at)}</strong>
                    último login
                  </span>
                </div>
              </article>
            ))}

            {!filteredUsers.length && (
              <div className="empty-state">Nenhum usuário encontrado.</div>
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
