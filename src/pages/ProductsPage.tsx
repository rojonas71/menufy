import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Tags,
  Trash2,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../types";

type BusinessMini = { id: string; name: string };

type ProductForm = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  promotional_price: string;
  badge: string;
  preparation_time: string;
  is_featured: boolean;
  is_sold_out: boolean;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  category_id: "",
  promotional_price: "",
  badge: "",
  preparation_time: "",
  is_featured: false,
  is_sold_out: false,
  is_active: true
};

export function ProductsPage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "active" | "hidden" | "soldout" | "featured">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

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
      setForm((prev) => ({ ...prev, category_id: prev.category_id || catRows[0].id }));
    }
  };

  useEffect(() => {
    load();
  }, [navigate]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q) ||
        (product.badge || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || product.category_id === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "active" && product.is_active && !product.is_sold_out) ||
        (availabilityFilter === "hidden" && !product.is_active) ||
        (availabilityFilter === "soldout" && product.is_sold_out) ||
        (availabilityFilter === "featured" && product.is_featured);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [products, search, categoryFilter, availabilityFilter]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id || ""
    });
    setEditing(null);
  };

  const validateForm = () => {
    const numericPrice = Number(form.price.replace(",", "."));
    const promo = form.promotional_price
      ? Number(form.promotional_price.replace(",", "."))
      : null;

    if (!form.name.trim()) return "Informe o nome do produto.";
    if (!form.category_id) return "Crie ou selecione uma categoria.";
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return "Preço inválido.";
    if (promo !== null && (!Number.isFinite(promo) || promo < 0)) return "Preço promocional inválido.";
    if (promo !== null && promo >= numericPrice) return "O preço promocional deve ser menor que o preço normal.";
    return "";
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !business) return;

    const validation = validateForm();
    if (validation) {
      setMessage(validation);
      return;
    }

    const numericPrice = Number(form.price.replace(",", "."));
    const promotionalPrice = form.promotional_price
      ? Number(form.promotional_price.replace(",", "."))
      : null;

    const payload = {
      business_id: business.id,
      category_id: form.category_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: numericPrice,
      promotional_price: promotionalPrice,
      image_url: form.image_url.trim() || null,
      badge: form.badge.trim() || null,
      preparation_time: form.preparation_time ? Number(form.preparation_time) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_sold_out: form.is_sold_out
    };

    setSaving(true);
    setMessage("");

    const query = editing
      ? supabase.from("products").update(payload).eq("id", editing.id)
      : supabase.from("products").insert({
          ...payload,
          sort_order: products.length + 1
        });

    const { data, error } = await query.select("*").single();

    if (error) {
      setMessage(error.message);
    } else {
      if (editing) {
        setProducts((current) =>
          current.map((product) => product.id === editing.id ? data as Product : product)
        );
        setMessage("Produto atualizado com sucesso.");
      } else {
        setProducts((current) => [...current, data as Product]);
        setMessage("Produto adicionado ao cardápio.");
      }
      resetForm();
    }

    setSaving(false);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price).replace(".", ","),
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      promotional_price:
        product.promotional_price != null
          ? String(product.promotional_price).replace(".", ",")
          : "",
      badge: product.badge || "",
      preparation_time: product.preparation_time ? String(product.preparation_time) : "",
      is_featured: product.is_featured,
      is_sold_out: Boolean(product.is_sold_out),
      is_active: product.is_active
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const patchProduct = async (product: Product, patch: Partial<Product>) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("products")
      .update(patch)
      .eq("id", product.id)
      .select("*")
      .single();

    if (error) setMessage(error.message);
    else {
      setProducts((current) =>
        current.map((item) => item.id === product.id ? data as Product : item)
      );
    }
  };

  const remove = async (product: Product) => {
    if (!supabase || !confirm(`Excluir “${product.name}” permanentemente?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) setMessage(error.message);
    else {
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage("Produto excluído.");
      if (editing?.id === product.id) resetForm();
    }
  };

  const activeCount = products.filter((product) => product.is_active).length;
  const soldOutCount = products.filter((product) => product.is_sold_out).length;
  const featuredCount = products.filter((product) => product.is_featured).length;

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Cardápio</span>
          <h1>Produtos</h1>
          <p className="dashboard-subtitle">
            Cadastre, edite, destaque e controle a disponibilidade dos itens.
          </p>
        </div>
      </header>

      <section className="mini-stat-grid">
        <article><span>Total</span><strong>{products.length}</strong><small>Produtos</small></article>
        <article><span>Ativos</span><strong>{activeCount}</strong><small>Visíveis</small></article>
        <article><span>Esgotados</span><strong>{soldOutCount}</strong><small>Indisponíveis</small></article>
        <article><span>Destaques</span><strong>{featuredCount}</strong><small>Promovidos</small></article>
      </section>

      <section className="dashboard-panel product-editor-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{editing ? "Edição" : "Cadastro"}</span>
            <h2>{editing ? `Editar ${editing.name}` : "Novo produto"}</h2>
            <p>
              {editing
                ? "Atualize as informações e salve as alterações."
                : "Preencha os dados para adicionar um item ao cardápio."}
            </p>
          </div>

          {editing && (
            <button className="button button-outline" onClick={resetForm}>
              <X size={16} /> Cancelar edição
            </button>
          )}
        </div>

        <form className="form-grid product-pro-form" onSubmit={saveProduct}>
          <label>
            Nome
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: X-Bacon Especial"
            />
          </label>

          <label>
            Categoria
            <select
              required
              value={form.category_id}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}
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
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="29,90"
            />
          </label>

          <label>
            Preço promocional
            <input
              inputMode="decimal"
              value={form.promotional_price}
              onChange={(event) => setForm({ ...form, promotional_price: event.target.value })}
              placeholder="24,90"
            />
          </label>

          <label>
            Selo
            <input
              value={form.badge}
              onChange={(event) => setForm({ ...form, badge: event.target.value })}
              placeholder="Mais pedido, Novo, Combo..."
              maxLength={30}
            />
          </label>

          <label>
            Tempo de preparo
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                max="999"
                value={form.preparation_time}
                onChange={(event) => setForm({ ...form, preparation_time: event.target.value })}
                placeholder="20"
              />
              <span>min</span>
            </div>
          </label>

          <label className="full">
            URL da imagem
            <input
              value={form.image_url}
              onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              placeholder="https://..."
            />
          </label>

          <label className="full">
            Descrição
            <textarea
              maxLength={500}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Descreva ingredientes, tamanho, sabor ou diferenciais..."
            />
            <small className="field-counter">{form.description.length}/500</small>
          </label>

          <div className="full product-option-grid">
            <label className="product-admin-checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              <span><strong>Produto ativo</strong><small>Visível no cardápio.</small></span>
            </label>

            <label className="product-admin-checkbox">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
              />
              <span><strong>Destaque</strong><small>Aparece na seção de favoritos.</small></span>
            </label>

            <label className="product-admin-checkbox">
              <input
                type="checkbox"
                checked={form.is_sold_out}
                onChange={(event) => setForm({ ...form, is_sold_out: event.target.checked })}
              />
              <span><strong>Esgotado</strong><small>Cliente não poderá adicionar ao pedido.</small></span>
            </label>
          </div>

          {message && <div className="form-message full">{message}</div>}

          <button className="button button-large full" disabled={saving}>
            {editing ? <Check size={18} /> : <Plus size={18} />}
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar produto"}
          </button>
        </form>
      </section>

      <section className="dashboard-panel products-admin-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2>Produtos cadastrados</h2>
            <p>{filtered.length} de {products.length} produtos exibidos.</p>
          </div>
        </div>

        <div className="product-toolbar">
          <label className="dev-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto, descrição ou selo..."
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </label>

          <label className="filter-select-with-icon">
            <Tags size={15} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Todas as categorias</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="filter-select-with-icon">
            <Filter size={15} />
            <select
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(event.target.value as typeof availabilityFilter)
              }
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="hidden">Ocultos</option>
              <option value="soldout">Esgotados</option>
              <option value="featured">Destaques</option>
            </select>
          </label>
        </div>

        <div className="product-manager-grid">
          {filtered.map((product) => (
            <article className={`product-manager-card ${!product.is_active ? "hidden" : ""}`} key={product.id}>
              <div className="product-manager-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <span>🍽️</span>
                )}

                <div className="product-manager-tags">
                  {product.is_featured && <span className="featured"><Star size={10} fill="currentColor" /> Destaque</span>}
                  {product.is_sold_out && <span className="sold">Esgotado</span>}
                  {!product.is_active && <span>Oculto</span>}
                </div>
              </div>

              <div className="product-manager-body">
                <div>
                  <small>{categoryMap.get(product.category_id) || "Sem categoria"}</small>
                  <h3>{product.name}</h3>
                  {product.description && <p>{product.description}</p>}
                </div>

                <div className="product-manager-price">
                  {product.promotional_price != null &&
                    Number(product.promotional_price) < Number(product.price) && (
                      <span>{formatBRL(Number(product.price))}</span>
                    )}
                  <strong>{formatBRL(Number(product.promotional_price ?? product.price))}</strong>
                </div>

                <div className="product-manager-actions">
                  <button className="button button-outline" onClick={() => openEdit(product)}>
                    <Pencil size={15} /> Editar
                  </button>

                  <button
                    className="icon-button"
                    onClick={() => patchProduct(product, { is_active: !product.is_active })}
                    title={product.is_active ? "Ocultar" : "Ativar"}
                  >
                    {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  <button
                    className="icon-button"
                    onClick={() => patchProduct(product, { is_featured: !product.is_featured })}
                    title="Alternar destaque"
                  >
                    <Star size={16} fill={product.is_featured ? "currentColor" : "none"} />
                  </button>

                  <button
                    className="danger-text-button"
                    onClick={() => remove(product)}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filtered.length && (
            <div className="empty-state product-manager-empty">
              <Package size={27} />
              <h3>Nenhum produto encontrado</h3>
              <p>Altere os filtros ou cadastre um novo produto.</p>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
