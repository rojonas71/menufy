import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";

type Status = "new" | "confirmed" | "preparing" | "out_for_delivery" | "completed" | "cancelled";
type Order = { id:string; order_number:number; business_id:string; customer_name:string; customer_phone:string; order_type:string; payment_method:string; status:Status; total:number; notes:string|null; created_at:string; };

const labels: Record<Status,string> = {
  new:"Novo", confirmed:"Confirmado", preparing:"Preparando",
  out_for_delivery:"Saiu para entrega", completed:"Finalizado", cancelled:"Cancelado"
};

export function OrdersPage() {
  const [businessId,setBusinessId]=useState<string|null>(null);
  const [orders,setOrders]=useState<Order[]>([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<"all"|Status>("all");
  const [message,setMessage]=useState("");
  const [savingId,setSavingId]=useState<string|null>(null);

  const load=async()=>{
    const client=supabase; if(!client)return;
    const {data:auth}=await client.auth.getUser(); if(!auth.user)return;
    const {data:business,error:businessError}=await client.from("businesses").select("id").eq("owner_id",auth.user.id).order("created_at").limit(1).maybeSingle();
    if(businessError||!business){setMessage(businessError?.message||"Estabelecimento não encontrado.");return;}
    setBusinessId(business.id);
    const {data,error}=await client.from("orders").select("id,order_number,business_id,customer_name,customer_phone,order_type,payment_method,status,total,notes,created_at").eq("business_id",business.id).order("created_at",{ascending:false}).limit(300);
    if(error)setMessage(error.message);else setOrders((data??[]) as Order[]);
  };

  useEffect(()=>{load();},[]);
  useEffect(()=>{
    const client=supabase;if(!client||!businessId)return;
    const channel=client.channel(`orders-${businessId}`).on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:`business_id=eq.${businessId}`},()=>load()).subscribe();
    return()=>{client.removeChannel(channel);};
  },[businessId]);

  const updateStatus=async(id:string,status:Status)=>{
    const client=supabase;if(!client)return;setSavingId(id);
    const {error}=await client.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)setMessage(error.message);else{
      setOrders(v=>v.map(o=>o.id===id?{...o,status}:o));
      await client.rpc("write_audit_log",{p_action:"order.status_changed",p_entity_type:"order",p_entity_id:id,p_business_id:businessId,p_metadata:{status}});
    }
    setSavingId(null);
  };

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return orders.filter(o=>(filter==="all"||o.status===filter)&&(!q||`${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(q)));
  },[orders,search,filter]);

  const open=orders.filter(o=>!["completed","cancelled"].includes(o.status)).length;
  const revenue=orders.filter(o=>o.status!=="cancelled").reduce((a,o)=>a+Number(o.total),0);

  return <DashboardShell>
    <header className="dashboard-header"><div><span className="eyebrow">Operação</span><h1>Pedidos</h1><p className="dashboard-subtitle">Acompanhe e atualize pedidos em tempo real.</p></div><button className="button button-outline" onClick={load}><RefreshCw size={17}/>Atualizar</button></header>
    {message&&<div className="form-message">{message}</div>}
    <section className="stat-grid">
      <article><span>Pedidos</span><strong>{orders.length}</strong><small>Carregados</small></article>
      <article><span>Em andamento</span><strong>{open}</strong><small>Operação</small></article>
      <article><span>Finalizados</span><strong>{orders.filter(o=>o.status==="completed").length}</strong><small>Concluídos</small></article>
      <article><span>Volume</span><strong>{formatBRL(revenue)}</strong><small>Não cancelados</small></article>
    </section>
    <section className="dashboard-panel">
      <div className="advanced-filter-row">
        <label className="dev-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pedido, cliente ou telefone..."/></label>
        <select value={filter} onChange={e=>setFilter(e.target.value as "all"|Status)}><option value="all">Todos os status</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div className="business-order-grid">
        {filtered.map(o=><article className="business-order-card" key={o.id}>
          <div className="business-order-head"><div><strong>#{o.order_number}</strong><span>{new Date(o.created_at).toLocaleString("pt-BR")}</span></div><span className={`status status-${o.status}`}>{labels[o.status]}</span></div>
          <div className="business-order-customer"><strong>{o.customer_name}</strong><span>{o.customer_phone}</span></div>
          <div className="business-order-meta"><span>{o.order_type||"Pedido"}</span><span>{o.payment_method||"Pagamento não informado"}</span></div>
          {o.notes&&<p className="business-order-notes">{o.notes}</p>}
          <div className="business-order-footer"><strong>{formatBRL(Number(o.total))}</strong><select value={o.status} disabled={savingId===o.id} onChange={e=>updateStatus(o.id,e.target.value as Status)}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        </article>)}
        {!filtered.length&&<div className="empty-state">Nenhum pedido encontrado.</div>}
      </div>
    </section>
  </DashboardShell>;
}
