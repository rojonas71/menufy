import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../types";

type BusinessMini = { id: string; name: string };

export function ProductsPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: ""
  });

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

      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("*").eq("business_id", b.id).order("sort_order"),
        supabase.from("products").select("*").eq("business_id", b.id).order("sort_order")
      ]);

      const catRows = (cats ?? []) as Category[];
      setCategories(catRows);
      setProducts((prods ?? []) as Product[]);

      if (catRows[0]) {
        setForm((prev) => ({ ...prev, category_id: catRows[0].id }));
      }
    };

    load();
  }, [navigate]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const addProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !business) return;

    const numericPrice = Number(form.price.replace(",", "."));
    if (!form.category_id) return setMessage("Crie uma categoria primeiro.");
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return setMessage("Preço inválido.");

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .insert({
        business_id: business.id,
        category_id: form.category_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: numericPrice,
        image_url: form.image_url.trim() || null,
        is_active: true,
        is_featured: false,
        sort_order: products.length + 1
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setProducts((current) => [...current, data as Product]);
      setForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category_id: form.category_id
      });
    }

    setSaving(false);
  };

  const toggle = async (product: Product) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id)
      .select("*")
      .single();

    if (error) setMessage(error.message);
    else setProducts((current) => current.map((p) => p.id === product.id ? data as Product : p));
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Excluir este produto?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) setMessage(error.message);
    else setProducts((current) => current.filter((p) => p.id !== id));
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Cardápio</span>
          <h1>Produtos</h1>
        </div>
      </header>

      <section className="dashboard-panel">
        <h2>Novo produto</h2>

        <form className="form-grid" onSubmit={addProduct}>
          <label>
            Nome
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Categoria
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            Preço
            <input
              required
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="29,90"
            />
          </label>

          <label>
            URL da imagem
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </label>

          <label className="full">
            Descrição
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          {message && <div className="form-message">{message}</div>}

          <button className="button button-large full" disabled={saving}>
            <Plus size={18} /> {saving ? "Salvando..." : "Adicionar produto"}
          </button>
        </form>
      </section>

      <section className="dashboard-panel products-admin-panel">
        <h2>Produtos cadastrados</h2>

        <div className="admin-list">
          {products.map((product) => (
            <div className="admin-list-row product-admin-row" key={product.id}>
              <div className="product-admin-main">
                {product.image_url ? <img src={product.image_url} alt="" /> : <div className="product-admin-placeholder">🍽️</div>}
                <div>
                  <strong>{product.name}</strong>
                  <small>{categoryMap.get(product.category_id) || "Sem categoria"} • {formatBRL(Number(product.price))}</small>
                </div>
              </div>

              <div className="admin-actions">
                <button className="button button-outline" onClick={() => toggle(product)}>
                  {product.is_active ? "Ocultar" : "Ativar"}
                </button>
                <button className="danger-text-button" onClick={() => remove(product.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}

          {!products.length && <div className="empty-state">Nenhum produto cadastrado.</div>}
        </div>
      </section>
    </DashboardShell>
  );
}
