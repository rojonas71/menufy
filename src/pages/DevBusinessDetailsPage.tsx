import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Save,
  ShoppingBag,
  Tag,
  UsersRound,
  WalletCards,
  Trash2
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Plan = "starter" | "pro" | "premium";
type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";
type OrderStatus = "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

type Business = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string;
  instagram: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_active: boolean;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
};

type Owner = {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  business_count: number;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
};

type RecentOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

const statusLabel: Record<OrderStatus, string> = {
  new: "Novo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  out_for_delivery: "Saiu para entrega",
  completed: "Finalizado",
  cancelled: "Cancelado"
};

function dateBR(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function DevBusinessDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const client = supabase;
    if (!client || !id) return;

    setLoading(true);
    setMessage("");

    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      navigate("/login", { replace: true });
      return;
    }

    const { data: admin } = await client
      .from("dev_admins")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!admin) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const [businessResult, usersResult, membersResult, ordersResult, productsResult, categoriesResult] = await Promise.all([
      client.from("businesses").select("id,owner_id,name,slug,description,logo_url,cover_url,phone,whatsapp,instagram,address,city,state,zip_code,primary_color,secondary_color,is_active,plan,subscription_status,created_at,updated_at").eq("id", id).maybeSingle(),
      client.rpc("dev_admin_users"),
      client.from("business_members").select("id,user_id,role,created_at").eq("business_id", id).order("created_at", { ascending: true }),
      client.from("orders").select("id,order_number,customer_name,status,total,created_at").eq("business_id", id).order("created_at", { ascending: false }).limit(50),
      client.from("products").select("id", { count: "exact", head: true }).eq("business_id", id),
      client.from("categories").select("id", { count: "exact", head: true }).eq("business_id", id)
    ]);

    if (businessResult.error || !businessResult.data) {
      setMessage(businessResult.error?.message || "Estabelecimento não encontrado.");
      setLoading(false);
      return;
    }

    const loadedBusiness = businessResult.data as Business;
    setBusiness(loadedBusiness);

    const allUsers = (usersResult.data ?? []) as Owner[];
    setOwner(allUsers.find((user) => user.user_id === loadedBusiness.owner_id) ?? null);
    setMembers((membersResult.data ?? []) as Member[]);
    setOrders((ordersResult.data ?? []) as RecentOrder[]);
    setProductCount(productsResult.count ?? 0);
    setCategoryCount(categoriesResult.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const revenue = useMemo(
    () => orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0),
    [orders]
  );

  const averageTicket = useMemo(() => {
    const valid = orders.filter((order) => order.status !== "cancelled");
    return valid.length ? revenue / valid.length : 0;
  }, [orders, revenue]);

  const updateField = <K extends keyof Business>(field: K, value: Business[K]) => {
    setBusiness((current) => current ? { ...current, [field]: value } : current);
  };

  const save = async () => {
    const client = supabase;
    if (!client || !business) return;

    if (!business.name.trim()) {
      setMessage("Informe o nome do estabelecimento.");
      return;
    }

    const cleanSlug = slugify(business.slug || business.name);
    if (!cleanSlug) {
      setMessage("Informe um slug válido.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      name: business.name.trim(),
      slug: cleanSlug,
      description: business.description?.trim() || null,
      logo_url: business.logo_url?.trim() || null,
      cover_url: business.cover_url?.trim() || null,
      phone: business.phone?.trim() || null,
      whatsapp: business.whatsapp.trim(),
      instagram: business.instagram?.trim() || null,
      address: business.address?.trim() || null,
      city: business.city?.trim() || null,
      state: business.state?.trim().toUpperCase().slice(0, 2) || null,
      zip_code: business.zip_code?.trim() || null,
      primary_color: business.primary_color || "#ff6b00",
      secondary_color: business.secondary_color || "#18120e",
      is_active: business.is_active,
      plan: business.plan,
      subscription_status: business.subscription_status,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("businesses")
      .update(payload)
      .eq("id", business.id)
      .select("id,owner_id,name,slug,description,logo_url,cover_url,phone,whatsapp,instagram,address,city,state,zip_code,primary_color,secondary_color,is_active,plan,subscription_status,created_at,updated_at")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setBusiness(data as Business);
      setMessage("Estabelecimento atualizado com sucesso.");
      await client.rpc("write_audit_log", {
        p_action: "business.admin_updated",
        p_entity_type: "business",
        p_entity_id: business.id,
        p_business_id: business.id,
        p_metadata: {
          name: payload.name,
          plan: payload.plan,
          subscription_status: payload.subscription_status,
          is_active: payload.is_active
        }
      });
    }

    setSaving(false);
  };

  const deleteBusinessPermanently = async () => {
    const client = supabase;
    if (!client || !business) return;

    if (deleteConfirmName.trim() !== business.name.trim()) {
      setMessage("Digite exatamente o nome do estabelecimento para confirmar.");
      return;
    }

    setDeleting(true);
    setMessage("");

    await client.rpc("write_audit_log", {
      p_action: "business.deleted_by_admin",
      p_entity_type: "business",
      p_entity_id: business.id,
      p_business_id: null,
      p_metadata: {
        business_id: business.id,
        business_name: business.name,
        slug: business.slug,
        owner_id: business.owner_id
      }
    });

    const { error } = await client
      .from("businesses")
      .delete()
      .eq("id", business.id);

    if (error) {
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    navigate("/dev", { replace: true });
  };

  if (loading) {
    return <main className="empty-state"><h2>Carregando estabelecimento...</h2></main>;
  }

  if (!business) {
    return (
      <main className="dev-access-page">
        <div className="dev-access-card">
          <Building2 size={44} />
          <h1>Estabelecimento não encontrado</h1>
          <p>{message}</p>
          <Link className="button" to="/dev">Voltar</Link>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-header business-details-header">
        <div>
          <Link className="business-back-link" to="/dev"><ArrowLeft size={16} /> Administração global</Link>
          <span className="eyebrow">Estabelecimento</span>
          <h1>{business.name}</h1>
          <p className="dashboard-subtitle">Gerencie cadastro, operação, proprietário e indicadores do negócio.</p>
        </div>

        <div className="dashboard-header-actions">
          <Link className="button button-outline" to={`/menu/${business.slug}`} target="_blank">
            Abrir cardápio <ExternalLink size={16} />
          </Link>
          <button className="button" onClick={save} disabled={saving}>
            <Save size={17} /> {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </header>

      {message && <div className="form-message">{message}</div>}

      <section className="stat-grid business-detail-stats">
        <article><span>Pedidos recentes</span><strong>{orders.length}</strong><small>Últimos 50</small></article>
        <article><span>Volume recente</span><strong>{formatBRL(revenue)}</strong><small>Não cancelados</small></article>
        <article><span>Ticket médio</span><strong>{formatBRL(averageTicket)}</strong><small>Pedidos recentes</small></article>
        <article><span>Catálogo</span><strong>{productCount}</strong><small>{categoryCount} categorias</small></article>
      </section>

      <div className="business-detail-layout">
        <div className="business-detail-main">
          <section className="dashboard-panel">
            <div className="panel-heading"><div><h2>Dados principais</h2><p>Identidade e informações públicas do estabelecimento.</p></div></div>
            <div className="form-grid business-admin-form">
              <label>Nome<input value={business.name} onChange={(e) => updateField("name", e.target.value)} /></label>
              <label>Slug<input value={business.slug} onChange={(e) => updateField("slug", e.target.value)} /></label>
              <label className="full">Descrição<textarea rows={4} value={business.description ?? ""} onChange={(e) => updateField("description", e.target.value)} /></label>
              <label>WhatsApp<input value={business.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} /></label>
              <label>Telefone<input value={business.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} /></label>
              <label>Instagram<input value={business.instagram ?? ""} onChange={(e) => updateField("instagram", e.target.value)} placeholder="@seunegocio" /></label>
              <label>CEP<input value={business.zip_code ?? ""} onChange={(e) => updateField("zip_code", e.target.value)} /></label>
              <label className="full">Endereço<input value={business.address ?? ""} onChange={(e) => updateField("address", e.target.value)} /></label>
              <label>Cidade<input value={business.city ?? ""} onChange={(e) => updateField("city", e.target.value)} /></label>
              <label>Estado<input maxLength={2} value={business.state ?? ""} onChange={(e) => updateField("state", e.target.value)} /></label>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading"><div><h2>Aparência</h2><p>Controle visual do cardápio público.</p></div></div>
            <div className="form-grid business-admin-form">
              <label className="full">URL da logo<input value={business.logo_url ?? ""} onChange={(e) => updateField("logo_url", e.target.value)} /></label>
              <label className="full">URL da capa<input value={business.cover_url ?? ""} onChange={(e) => updateField("cover_url", e.target.value)} /></label>
              <label>Cor principal<div className="admin-color-input"><input type="color" value={business.primary_color || "#ff6b00"} onChange={(e) => updateField("primary_color", e.target.value)} /><input value={business.primary_color || "#ff6b00"} onChange={(e) => updateField("primary_color", e.target.value)} /></div></label>
              <label>Cor secundária<div className="admin-color-input"><input type="color" value={business.secondary_color || "#18120e"} onChange={(e) => updateField("secondary_color", e.target.value)} /><input value={business.secondary_color || "#18120e"} onChange={(e) => updateField("secondary_color", e.target.value)} /></div></label>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading"><div><h2>Pedidos recentes</h2><p>Visão operacional rápida deste estabelecimento.</p></div></div>
            <div className="business-recent-orders">
              {orders.slice(0, 12).map((order) => (
                <article key={order.id}>
                  <div><strong>#{order.order_number}</strong><span>{order.customer_name}</span></div>
                  <span className={`status status-${order.status}`}>{statusLabel[order.status]}</span>
                  <strong>{formatBRL(Number(order.total))}</strong>
                  <small>{dateBR(order.created_at)}</small>
                </article>
              ))}
              {!orders.length && <div className="empty-state">Nenhum pedido registrado.</div>}
            </div>
          </section>
        </div>

        <aside className="business-detail-side">
          <section className="dashboard-panel business-control-panel">
            <div className="panel-heading"><div><h2>Controle</h2><p>Status administrativo.</p></div></div>
            <label>Plano<select value={business.plan} onChange={(e) => updateField("plan", e.target.value as Plan)}><option value="starter">Starter</option><option value="pro">Pro</option><option value="premium">Premium</option></select></label>
            <label>Assinatura<select value={business.subscription_status} onChange={(e) => updateField("subscription_status", e.target.value as SubscriptionStatus)}><option value="active">Ativa</option><option value="trial">Teste</option><option value="past_due">Pendente</option><option value="cancelled">Cancelada</option></select></label>
            <label className="business-active-toggle"><input type="checkbox" checked={business.is_active} onChange={(e) => updateField("is_active", e.target.checked)} /><div><strong>Cardápio ativo</strong><span>{business.is_active ? "Disponível publicamente" : "Desativado"}</span></div></label>
          </section>

          <section className="dashboard-panel business-owner-panel">
            <div className="panel-heading"><div><h2><UsersRound size={18} /> Proprietário</h2></div></div>
            <div className="business-owner-card">
              <strong>{owner?.email || "Email indisponível"}</strong>
              <span>ID: {business.owner_id || "Sem proprietário"}</span>
              <span>Cadastro: {dateBR(owner?.created_at || null)}</span>
              <span>Último login: {dateBR(owner?.last_sign_in_at || null)}</span>
              <span>Negócios: {owner?.business_count ?? 0}</span>
            </div>
          </section>

          <section className="dashboard-panel business-owner-panel">
            <div className="panel-heading"><div><h2>Equipe</h2><p>{members.length} membros cadastrados</p></div></div>
            <div className="business-members-list">
              {members.map((member) => (
                <div key={member.id}><span>{member.user_id}</span><strong>{member.role}</strong></div>
              ))}
              {!members.length && <span className="business-muted">Nenhum membro adicional.</span>}
            </div>
          </section>

          <section className="dashboard-panel business-owner-panel">
            <div className="panel-heading"><div><h2>Informações</h2></div></div>
            <div className="business-info-list">
              <span><Building2 size={15} /> Criado {dateBR(business.created_at)}</span>
              <span><WalletCards size={15} /> Atualizado {dateBR(business.updated_at)}</span>
              <span><MapPin size={15} /> {business.city || "Cidade não informada"}{business.state ? `/${business.state}` : ""}</span>
              <span><Tag size={15} /> /{business.slug}</span>
              <span><ShoppingBag size={15} /> {productCount} produtos</span>
            </div>
          </section>
        </aside>
      </div>

      <section className="dashboard-panel danger-zone-panel">
        <div className="danger-zone-heading">
          <div>
            <span className="eyebrow danger-eyebrow">Zona de perigo</span>
            <h2>Excluir estabelecimento</h2>
            <p>
              Exclui permanentemente o estabelecimento e seus dados vinculados
              pelas regras de cascata do banco, incluindo catálogo e pedidos.
            </p>
          </div>
          <Trash2 size={24} />
        </div>

        {deleteStep === 0 && (
          <button type="button" className="button danger-button" onClick={() => setDeleteStep(1)}>
            <Trash2 size={17} /> Excluir estabelecimento
          </button>
        )}

        {deleteStep === 1 && (
          <div className="delete-confirm-box">
            <strong>Esta ação é permanente.</strong>
            <p>
              Você está prestes a excluir <b>{business.name}</b> e os registros
              vinculados ao negócio. Esta ação não pode ser desfeita.
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="button button-outline" onClick={() => setDeleteStep(0)}>Cancelar</button>
              <button type="button" className="button danger-button" onClick={() => setDeleteStep(2)}>Continuar</button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="delete-confirm-box final">
            <strong>Confirmação final</strong>
            <p>Digite exatamente o nome abaixo:</p>
            <code>{business.name}</code>
            <input
              value={deleteConfirmName}
              onChange={(event) => setDeleteConfirmName(event.target.value)}
              placeholder="Digite o nome do estabelecimento"
              autoComplete="off"
            />
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={deleting}
                onClick={() => { setDeleteStep(0); setDeleteConfirmName(""); }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button danger-button"
                disabled={deleting || deleteConfirmName.trim() !== business.name.trim()}
                onClick={deleteBusinessPermanently}
              >
                <Trash2 size={17} /> {deleting ? "Excluindo..." : "Excluir permanentemente"}
              </button>
            </div>
          </div>
        )}
      </section>

    </DashboardShell>
  );
}
