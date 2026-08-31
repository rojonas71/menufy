import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  X
} from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Status = "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

type Order = {
  id: string;
  order_number: number;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  payment_method: string;
  status: Status;
  subtotal?: number;
  delivery_fee?: number;
  total: number;
  notes: string | null;
  delivery_address?: string | null;
  created_at: string;
};

const labels: Record<Status, string> = {
  new: "Novo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  out_for_delivery: "Saiu para entrega",
  completed: "Finalizado",
  cancelled: "Cancelado"
};

const statusOrder: Status[] = [
  "new",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled"
];

export function OrdersPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("today");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");

  const load = async () => {
    const client = supabase;
    if (!client) return;

    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return;

    const { data: business, error: businessError } = await client
      .from("businesses")
      .select("id")
      .eq("owner_id", auth.user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (businessError || !business) {
      setMessage(businessError?.message || "Estabelecimento não encontrado.");
      return;
    }

    setBusinessId(business.id);

    const { data, error } = await client
      .from("orders")
      .select("id,order_number,business_id,customer_name,customer_phone,order_type,payment_method,status,subtotal,delivery_fee,total,notes,delivery_address,created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) setMessage(error.message);
    else setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !businessId) return;

    const channel = client
      .channel(`orders-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`
        },
        () => load()
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("offline");
        else setConnection("connecting");
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [businessId]);

  const updateStatus = async (id: string, status: Status) => {
    const client = supabase;
    if (!client) return;

    setSavingId(id);

    const { error } = await client
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setOrders((current) =>
        current.map((order) => order.id === id ? { ...order, status } : order)
      );

      await client.rpc("write_audit_log", {
        p_action: "order.status_changed",
        p_entity_type: "order",
        p_entity_id: id,
        p_business_id: businessId,
        p_metadata: { status }
      });
    }

    setSavingId(null);
  };

  const periodStart = useMemo(() => {
    if (period === "all") return null;

    const now = new Date();

    if (period === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const days = period === "7d" ? 7 : 30;
    return new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  }, [period]);

  const periodOrders = useMemo(
    () =>
      orders.filter((order) =>
        !periodStart || new Date(order.created_at).getTime() >= periodStart.getTime()
      ),
    [orders, periodStart]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return periodOrders.filter((order) => {
      const matchesFilter = filter === "all" || order.status === filter;
      const searchable = `${order.order_number} ${order.customer_name} ${order.customer_phone} ${order.delivery_address || ""}`.toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [periodOrders, search, filter]);

  const open = periodOrders.filter((order) =>
    !["completed", "cancelled"].includes(order.status)
  ).length;

  const completed = periodOrders.filter((order) => order.status === "completed").length;

  const revenue = periodOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const ticket = periodOrders.filter((order) => order.status !== "cancelled").length
    ? revenue / periodOrders.filter((order) => order.status !== "cancelled").length
    : 0;

  const exportCsv = () => {
    const headers = [
      "Pedido",
      "Cliente",
      "Telefone",
      "Tipo",
      "Pagamento",
      "Status",
      "Total",
      "Data"
    ];

    const rows = filtered.map((order) => [
      order.order_number,
      order.customer_name,
      order.customer_phone,
      order.order_type || "",
      order.payment_method || "",
      labels[order.status],
      Number(order.total).toFixed(2),
      new Date(order.created_at).toLocaleString("pt-BR")
    ]);

    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pedidos-menufy-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <div className="dashboard-live-line">
            <span className="eyebrow">Operação</span>
            <span className={`realtime-badge ${connection}`}>
              {connection === "live" ? "Tempo real" : connection === "connecting" ? "Conectando" : "Offline"}
            </span>
          </div>
          <h1>Pedidos</h1>
          <p className="dashboard-subtitle">
            Filtre, acompanhe, atualize status e exporte sua operação.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button className="button button-outline" onClick={exportCsv}>
            <Download size={17} /> Exportar CSV
          </button>

          <button className="button button-outline" onClick={load}>
            <RefreshCw size={17} /> Atualizar
          </button>
        </div>
      </header>

      {message && <div className="form-message">{message}</div>}

      <section className="mini-stat-grid">
        <article><span>Pedidos</span><strong>{periodOrders.length}</strong><small>No período</small></article>
        <article><span>Em andamento</span><strong>{open}</strong><small>Operação atual</small></article>
        <article><span>Finalizados</span><strong>{completed}</strong><small>Concluídos</small></article>
        <article><span>Volume</span><strong>{formatBRL(revenue)}</strong><small>Ticket {formatBRL(ticket)}</small></article>
      </section>

      <section className="dashboard-panel">
        <div className="order-period-tabs">
          {[
            ["today", "Hoje"],
            ["7d", "7 dias"],
            ["30d", "30 dias"],
            ["all", "Tudo"]
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={period === value ? "active" : ""}
              onClick={() => setPeriod(value as typeof period)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="order-status-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Todos <span>{periodOrders.length}</span>
          </button>

          {statusOrder.map((status) => {
            const count = periodOrders.filter((order) => order.status === status).length;
            return (
              <button
                key={status}
                className={filter === status ? "active" : ""}
                onClick={() => setFilter(status)}
              >
                {labels[status]} <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="advanced-filter-row order-filter-row">
          <label className="dev-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pedido, cliente, telefone ou endereço..."
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </label>

          <span className="order-filter-result">
            <CalendarDays size={15} />
            {filtered.length} pedido(s)
          </span>
        </div>

        <div className="business-order-grid order-pro-grid">
          {filtered.map((order) => {
            const phone = order.customer_phone.replace(/\D/g, "");

            return (
              <article className={`business-order-card order-pro-card status-border-${order.status}`} key={order.id}>
                <div className="business-order-head">
                  <div>
                    <strong>#{order.order_number}</strong>
                    <span>{new Date(order.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <span className={`status status-${order.status}`}>{labels[order.status]}</span>
                </div>

                <div className="business-order-customer">
                  <strong>{order.customer_name}</strong>
                  <span><Phone size={13} /> {order.customer_phone}</span>
                </div>

                <div className="business-order-meta">
                  <span>{order.order_type || "Pedido"}</span>
                  <span>{order.payment_method || "Pagamento não informado"}</span>
                </div>

                {order.delivery_address && (
                  <div className="order-address">
                    <span>Entrega</span>
                    <strong>{order.delivery_address}</strong>
                  </div>
                )}

                {order.notes && <p className="business-order-notes">{order.notes}</p>}

                <div className="order-pro-totals">
                  {order.subtotal != null && (
                    <span>Subtotal <strong>{formatBRL(Number(order.subtotal))}</strong></span>
                  )}
                  {Number(order.delivery_fee || 0) > 0 && (
                    <span>Entrega <strong>{formatBRL(Number(order.delivery_fee))}</strong></span>
                  )}
                </div>

                <div className="business-order-footer order-pro-footer">
                  <div>
                    <span>Total</span>
                    <strong>{formatBRL(Number(order.total))}</strong>
                  </div>

                  <div className="order-pro-actions">
                    {phone && (
                      <a
                        className="icon-button"
                        href={`https://wa.me/${phone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Falar com cliente no WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}

                    <select
                      value={order.status}
                      disabled={savingId === order.id}
                      onChange={(event) => updateStatus(order.id, event.target.value as Status)}
                    >
                      {Object.entries(labels).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}

          {!filtered.length && (
            <div className="empty-state order-empty-state">
              <ShoppingBag size={28} />
              <h3>Nenhum pedido encontrado</h3>
              <p>Ajuste os filtros ou aguarde novos pedidos.</p>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
