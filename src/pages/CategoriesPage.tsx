import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";
import type { Category } from "../types";

type BusinessMini = { id: string; name: string };
type ProductMini = { id: string; category_id: string | null; is_active: boolean };

export function CategoriesPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductMini[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");

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

    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("business_id", b.id)
        .order("sort_order"),
      supabase
        .from("products")
        .select("id,category_id,is_active")
        .eq("business_id", b.id)
    ]);

    setCategories((cats ?? []) as Category[]);
    setProducts((prods ?? []) as ProductMini[]);
  };

  useEffect(() => {
    load();
  }, [navigate]);

  const productCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      if (!product.category_id) continue;
      map.set(product.category_id, (map.get(product.category_id) || 0) + 1);
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(q));
  }, [categories, search]);

  const visibleCount = categories.filter((category) => category.is_active).length;

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
      setMessage("Categoria criada com sucesso.");
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
    else {
      setCategories((current) =>
        current.map((c) => c.id === category.id ? data as Category : c)
      );
    }
  };

  const saveEdit = async () => {
    if (!supabase || !editing || !editName.trim()) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .update({ name: editName.trim() })
      .eq("id", editing.id)
      .select("*")
      .single();

    if (error) setMessage(error.message);
    else {
      setCategories((current) =>
        current.map((category) => category.id === editing.id ? data as Category : category)
      );
      setEditing(null);
      setEditName("");
      setMessage("Categoria atualizada.");
    }

    setSaving(false);
  };

  const move = async (category: Category, direction: -1 | 1) => {
    if (!supabase) return;

    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((item) => item.id === category.id);
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const target = sorted[targetIndex];
    const originalSort = category.sort_order;
    const targetSort = target.sort_order;

    setCategories((current) =>
      current
        .map((item) => {
          if (item.id === category.id) return { ...item, sort_order: targetSort };
          if (item.id === target.id) return { ...item, sort_order: originalSort };
          return item;
        })
        .sort((a, b) => a.sort_order - b.sort_order)
    );

    const [first, second] = await Promise.all([
      supabase.from("categories").update({ sort_order: targetSort }).eq("id", category.id),
      supabase.from("categories").update({ sort_order: originalSort }).eq("id", target.id)
    ]);

    if (first.error || second.error) {
      setMessage(first.error?.message || second.error?.message || "Não foi possível reordenar.");
      await load();
    }
  };

  const remove = async (category: Category) => {
    if (!supabase) return;

    const count = productCountByCategory.get(category.id) || 0;

    if (count > 0) {
      setMessage(
        `A categoria “${category.name}” possui ${count} produto(s). Mova ou exclua esses produtos antes de remover a categoria.`
      );
      return;
    }

    if (!confirm(`Excluir a categoria “${category.name}”?`)) return;

    const { error } = await supabase.from("categories").delete().eq("id", category.id);

    if (error) setMessage(error.message);
    else {
      setCategories((current) => current.filter((c) => c.id !== category.id));
      setMessage("Categoria excluída.");
    }
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Cardápio</span>
          <h1>Categorias</h1>
          <p className="dashboard-subtitle">
            Organize seu cardápio, controle visibilidade e ordem de exibição.
          </p>
        </div>
      </header>

      <section className="mini-stat-grid">
        <article><span>Total</span><strong>{categories.length}</strong><small>Categorias</small></article>
        <article><span>Visíveis</span><strong>{visibleCount}</strong><small>No cardápio</small></article>
        <article><span>Ocultas</span><strong>{categories.length - visibleCount}</strong><small>Fora do cardápio</small></article>
        <article><span>Produtos</span><strong>{products.length}</strong><small>Distribuídos</small></article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Nova categoria</span>
            <h2>Adicionar categoria</h2>
            <p>Ex.: Hambúrgueres, Combos, Bebidas, Sobremesas.</p>
          </div>
        </div>

        <form className="inline-create-form category-create-form" onSubmit={addCategory}>
          <div className="category-create-input">
            <Tags size={17} />
            <input
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome da categoria"
            />
            <small>{name.length}/60</small>
          </div>

          <button className="button" disabled={saving || !name.trim()}>
            <Plus size={18} /> {saving ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="category-toolbar">
          <label className="dev-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categoria..."
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </label>

          <span>{filtered.length} resultado(s)</span>
        </div>

        {message && <div className="form-message">{message}</div>}

        <div className="category-manager-list">
          {filtered.map((category) => {
            const count = productCountByCategory.get(category.id) || 0;

            return (
              <article className="category-manager-row" key={category.id}>
                <div className="category-order-controls">
                  <button
                    type="button"
                    onClick={() => move(category, -1)}
                    aria-label="Mover para cima"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(category, 1)}
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>

                <div className="category-manager-main">
                  <span className="category-manager-icon">
                    <Tags size={18} />
                  </span>

                  <div>
                    <strong>{category.name}</strong>
                    <span>
                      {count} {count === 1 ? "produto" : "produtos"} • posição {category.sort_order}
                    </span>
                  </div>
                </div>

                <span className={`category-visibility ${category.is_active ? "active" : ""}`}>
                  {category.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  {category.is_active ? "Visível" : "Oculta"}
                </span>

                <div className="admin-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => toggle(category)}
                  >
                    {category.is_active ? "Ocultar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setEditing(category);
                      setEditName(category.name);
                    }}
                    aria-label="Editar categoria"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="danger-text-button"
                    onClick={() => remove(category)}
                    aria-label="Excluir categoria"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}

          {!filtered.length && (
            <div className="empty-state">
              {search ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
            </div>
          )}
        </div>
      </section>

      {editing && (
        <div className="simple-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditing(null);
        }}>
          <section className="simple-modal">
            <div className="simple-modal-head">
              <div>
                <span className="eyebrow">Editar categoria</span>
                <h2>{editing.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setEditing(null)}>
                <X size={17} />
              </button>
            </div>

            <label className="modal-field">
              Nome da categoria
              <input
                value={editName}
                maxLength={60}
                onChange={(event) => setEditName(event.target.value)}
              />
            </label>

            <div className="simple-modal-actions">
              <button className="button button-outline" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="button" disabled={saving || !editName.trim()} onClick={saveEdit}>
                <Check size={17} /> Salvar alterações
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
