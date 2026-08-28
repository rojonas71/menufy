import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";
import type { Category } from "../types";

type BusinessMini = { id: string; name: string };

export function CategoriesPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return navigate("/login", { replace: true });

      const { data: b } = await supabase
        .from("businesses")
        .select("id,name")
        .eq("owner_id", auth.user.id)
        .limit(1)
        .maybeSingle();

      if (!b) return navigate("/onboarding", { replace: true });

      setBusiness(b);

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("business_id", b.id)
        .order("sort_order");

      setCategories((data ?? []) as Category[]);
    };

    load();
  }, [navigate]);

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !business || !name.trim()) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        business_id: business.id,
        name: name.trim(),
        sort_order: categories.length + 1,
        is_active: true
      })
      .select("*")
      .single();

    if (error) setMessage(error.message);
    else {
      setCategories((current) => [...current, data as Category]);
      setName("");
    }

    setSaving(false);
  };

  const toggle = async (category: Category) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id)
      .select("*")
      .single();

    if (error) setMessage(error.message);
    else setCategories((current) => current.map((c) => c.id === category.id ? data as Category : c));
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Excluir esta categoria?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setMessage(error.message);
    else setCategories((current) => current.filter((c) => c.id !== id));
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Cardápio</span>
          <h1>Categorias</h1>
        </div>
      </header>

      <section className="dashboard-panel">
        <form className="inline-create-form" onSubmit={addCategory}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Hambúrgueres"
          />
          <button className="button" disabled={saving}>
            <Plus size={18} /> Adicionar
          </button>
        </form>

        {message && <div className="form-message">{message}</div>}

        <div className="admin-list">
          {categories.map((category) => (
            <div className="admin-list-row" key={category.id}>
              <div>
                <strong>{category.name}</strong>
                <small>{category.is_active ? "Visível no cardápio" : "Oculta"}</small>
              </div>

              <div className="admin-actions">
                <button className="button button-outline" onClick={() => toggle(category)}>
                  {category.is_active ? "Ocultar" : "Ativar"}
                </button>
                <button className="danger-text-button" onClick={() => remove(category.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}

          {!categories.length && <div className="empty-state">Nenhuma categoria cadastrada.</div>}
        </div>
      </section>
    </DashboardShell>
  );
}
