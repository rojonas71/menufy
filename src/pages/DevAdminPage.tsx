import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Plan = "starter" | "pro" | "premium";
type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  created_at: string;
};

type OrderRow = {
  id: string;
  order_number: number;
  business_id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
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

export function DevAdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

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
      const lower = adminError.message.toLowerCase();
      const missingTable =
        lower.includes("dev_admins") ||
        lower.includes("schema cache");

      setMessage(
        missingTable
          ? "Admin Dev ainda não foi ativado no Supabase. Execute as migrations 004_dev_admin.sql e 005_business_plans.sql."
          : adminError.message
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
      { data: orderRows, error: orderError }
    ] = await Promise.all([
      client
        .from("businesses")
        .select(
          "id,name,slug,whatsapp,city,state,is_active,plan,subscription_status,created_at"
        )
        .order("created_at", { ascending: false }),
      client
        .from("orders")
        .select(
          "id,order_number,business_id,customer_name,total,status,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

    if (businessError) {
      const lower = businessError.message.toLowerCase();
      if (lower.includes("plan") || lower.includes("subscription_status")) {
        setMessage(
          "Execute a migration 005_business_plans.sql no Supabase para ativar gerenciamento de planos."
        );
      } else {
        setMessage(businessError.message);
      }
    } else {
      setBusinesses((businessRows ?? []) as BusinessRow[]);
    }

    if (orderError) {
      setMessage((current) => current || orderError.message);
    } else {
      setOrders((orderRows ?? []) as OrderRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateBusiness = async (
    businessId: string,
    changes: Partial<Pick<BusinessRow, "is_active" | "plan" | "subscription_status">>
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
        "id,name,slug,whatsapp,city,state,is_active,plan,subscription_status,created_at"
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
    }

    setSavingId(null);
  };

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return businesses;

    return businesses.filter((business) =>
      [
        business.name,
        business.slug,
        business.whatsapp,
        business.city || "",
        business.state || "",
        planLabel[business.plan]
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [businesses, search]);

  const activeBusinesses = businesses.filter((business) => business.is_active).length;

  const proBusinesses = businesses.filter(
    (business) => business.plan === "pro"
  ).length;

  const premiumBusinesses = businesses.filter(
    (business) => business.plan === "premium"
  ).length;

  const totalSales = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total), 0),
    [orders]
  );

  const businessMap = useMemo(
    () => new Map(businesses.map((business) => [business.id, business.name])),
    [businesses]
  );

  if (loading) {
    return (
      <main className="empty-state">
        <h2>Carregando Admin Dev...</h2>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="dev-access-page">
        <div className="dev-access-card">
          <ShieldCheck size={46} />
          <span className="eyebrow">Admin Dev</span>
          <h1>{message ? "Admin Dev não configurado" : "Acesso restrito"}</h1>
          <p>
            {message ||
              "Esta área é exclusiva do administrador de desenvolvimento autorizado no Supabase."}
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
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Administração global</span>
          <h1>Admin Dev</h1>
          <p className="dashboard-subtitle">
            Gerencie estabelecimentos, planos e atividade da plataforma.
          </p>
        </div>

        <button className="button button-outline" onClick={load}>
          <RefreshCw size={17} /> Atualizar
        </button>
      </header>

      {message && <div className="form-message">{message}</div>}

      <section className="stat-grid">
        <article>
          <span>Estabelecimentos</span>
          <strong>{businesses.length}</strong>
          <small>{activeBusinesses} ativos</small>
        </article>

        <article>
          <span>Plano Pro</span>
          <strong>{proBusinesses}</strong>
          <small>Estabelecimentos</small>
        </article>

        <article>
          <span>Premium</span>
          <strong>{premiumBusinesses}</strong>
          <small>Estabelecimentos</small>
        </article>

        <article>
          <span>Volume</span>
          <strong>{formatBRL(totalSales)}</strong>
          <small>Últimos pedidos carregados</small>
        </article>
      </section>

      <section className="dashboard-panel dev-admin-section">
        <div className="panel-heading dev-panel-heading">
          <div>
            <h2><Store size={20} /> Estabelecimentos</h2>
            <p>Altere plano, assinatura e disponibilidade do cardápio.</p>
          </div>

          <label className="dev-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar estabelecimento..."
            />
          </label>
        </div>

        <div className="dev-business-grid">
          {filteredBusinesses.map((business) => (
            <article className="dev-business-card" key={business.id}>
              <div className="dev-business-card-head">
                <div>
                  <strong>{business.name}</strong>
                  <span>
                    {business.city || "Cidade não informada"}
                    {business.state ? `/${business.state}` : ""}
                  </span>
                </div>

                <span className={business.is_active ? "dev-status active" : "dev-status"}>
                  {business.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="dev-business-meta">
                <span>/{business.slug}</span>
                <span>{business.whatsapp}</span>
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
                        subscription_status: event.target.value as SubscriptionStatus
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

                <Link
                  className="button button-outline"
                  to={`/menu/${business.slug}`}
                >
                  Abrir <ExternalLink size={16} />
                </Link>
              </div>
            </article>
          ))}

          {!filteredBusinesses.length && (
            <div className="empty-state">
              Nenhum estabelecimento encontrado.
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panel dev-admin-section">
        <div className="panel-heading">
          <div>
            <h2><ShoppingBag size={20} /> Pedidos recentes</h2>
            <p>Últimos pedidos registrados em toda a plataforma.</p>
          </div>
        </div>

        <div className="order-table">
          {orders.map((order) => (
            <div className="order-row" key={order.id}>
              <strong>#{order.order_number}</strong>
              <span>{businessMap.get(order.business_id) || "Estabelecimento"}</span>
              <span>{order.customer_name}</span>
              <strong>{formatBRL(Number(order.total))}</strong>
            </div>
          ))}

          {!orders.length && (
            <div className="empty-state">Nenhum pedido encontrado.</div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
