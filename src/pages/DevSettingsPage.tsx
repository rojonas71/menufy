import { useEffect,useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";

type Settings={name:string;maintenance_mode:boolean;new_businesses_enabled:boolean;support_whatsapp:string;support_email:string};
const defaults:Settings={name:"Menufy",maintenance_mode:false,new_businesses_enabled:true,support_whatsapp:"",support_email:""};

export function DevSettingsPage(){
  const [settings,setSettings]=useState(defaults),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);
  useEffect(()=>{(async()=>{const c=supabase;if(!c)return;const {data,error}=await c.from("system_settings").select("value").eq("key","platform").maybeSingle();if(error)setMessage(error.message.toLowerCase().includes("system_settings")?"Execute 007_advanced_admin.sql no Supabase.":error.message);else if(data?.value)setSettings({...defaults,...(data.value as Settings)});})();},[]);
  const save=async()=>{const c=supabase;if(!c)return;setSaving(true);setMessage("");const {data:auth}=await c.auth.getUser();const {error}=await c.from("system_settings").upsert({key:"platform",value:settings,description:"Configurações gerais da plataforma",updated_by:auth.user?.id??null,updated_at:new Date().toISOString()},{onConflict:"key"});if(error)setMessage(error.message);else{await c.rpc("write_audit_log",{p_action:"system.settings_updated",p_entity_type:"system_settings",p_entity_id:"platform",p_business_id:null,p_metadata:settings});setMessage("Configurações salvas com sucesso.");}setSaving(false);};

  return <DashboardShell>
    <header className="dashboard-header"><div><span className="eyebrow">Administração global</span><h1>Configurações</h1><p className="dashboard-subtitle">Parâmetros centrais da plataforma.</p></div></header>
    {message&&<div className="form-message">{message}</div>}
    <section className="dashboard-panel advanced-settings-panel">
      <div className="panel-heading"><div><h2><Settings2 size={20}/> Plataforma</h2><p>Configurações administrativas centrais.</p></div></div>
      <div className="form-grid">
        <label>Nome<input value={settings.name} onChange={e=>setSettings(v=>({...v,name:e.target.value}))}/></label>
        <label>WhatsApp de suporte<input value={settings.support_whatsapp} onChange={e=>setSettings(v=>({...v,support_whatsapp:e.target.value}))}/></label>
        <label className="full">Email de suporte<input type="email" value={settings.support_email} onChange={e=>setSettings(v=>({...v,support_email:e.target.value}))}/></label>
      </div>
      <div className="advanced-toggle-list">
        <label className="advanced-toggle-card"><input type="checkbox" checked={settings.new_businesses_enabled} onChange={e=>setSettings(v=>({...v,new_businesses_enabled:e.target.checked}))}/><div><strong>Novos estabelecimentos</strong><span>Permitir novos cadastros e onboarding.</span></div></label>
        <label className="advanced-toggle-card danger"><input type="checkbox" checked={settings.maintenance_mode} onChange={e=>setSettings(v=>({...v,maintenance_mode:e.target.checked}))}/><div><strong>Modo manutenção</strong><span>Sinalizar manutenção da plataforma.</span></div></label>
      </div>
      <button className="button button-large" onClick={save} disabled={saving}><Save size={18}/>{saving?"Salvando...":"Salvar configurações"}</button>
    </section>
  </DashboardShell>;
}
