import { useEffect,useMemo,useState } from "react";
import { RefreshCw,Search } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";

type Log={id:string;actor_email:string|null;action:string;entity_type:string;entity_id:string|null;business_id:string|null;metadata:Record<string,unknown>;created_at:string};

export function DevAuditPage(){
  const [logs,setLogs]=useState<Log[]>([]),[search,setSearch]=useState(""),[message,setMessage]=useState("");
  const load=async()=>{const c=supabase;if(!c)return;const {data,error}=await c.from("audit_logs").select("id,actor_email,action,entity_type,entity_id,business_id,metadata,created_at").order("created_at",{ascending:false}).limit(500);if(error)setMessage(error.message.toLowerCase().includes("audit_logs")?"Execute 007_advanced_admin.sql no Supabase.":error.message);else setLogs((data??[]) as Log[]);};
  useEffect(()=>{load();},[]);
  const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return !q?logs:logs.filter(l=>`${l.actor_email||""} ${l.action} ${l.entity_type} ${l.entity_id||""}`.toLowerCase().includes(q));},[logs,search]);
  return <DashboardShell>
    <header className="dashboard-header"><div><span className="eyebrow">Administração global</span><h1>Auditoria</h1><p className="dashboard-subtitle">Histórico de ações administrativas.</p></div><button className="button button-outline" onClick={load}><RefreshCw size={17}/>Atualizar</button></header>
    {message&&<div className="form-message">{message}</div>}
    <section className="dashboard-panel">
      <label className="dev-search audit-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar usuário, ação ou entidade..."/></label>
      <div className="audit-list">{filtered.map(l=><article className="audit-card" key={l.id}><div className="audit-card-head"><strong>{l.action}</strong><span>{new Date(l.created_at).toLocaleString("pt-BR")}</span></div><div className="audit-card-meta"><span>{l.actor_email||"Sistema"}</span><span>{l.entity_type}</span>{l.entity_id&&<span>{l.entity_id}</span>}</div>{Object.keys(l.metadata||{}).length>0&&<pre>{JSON.stringify(l.metadata,null,2)}</pre>}</article>)}{!filtered.length&&<div className="empty-state">Nenhum registro encontrado.</div>}</div>
    </section>
  </DashboardShell>;
}
