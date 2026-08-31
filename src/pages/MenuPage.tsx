import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Clock3,
  Instagram,
  MapPin,
  Minus,
  Plus,
  Radio,
  Search,
  ShoppingBag,
  Star,
  X
} from "lucide-react";
import { useParams } from "react-router-dom";
import { CartBar } from "../components/CartBar";
import { InstallAppButton } from "../components/InstallAppButton";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Business, Category, Product } from "../types";

export function MenuPage() {
  const { slug = "" } = useParams();
  const { addItem } = useCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline"
  );

  useEffect(() => {
    const client = supabase;

    if (!isSupabaseConfigured || !client || !slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      const { data: businessData, error: businessError } = await client
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (businessError || !businessData) {
        setBusiness(null);
        setCategories([]);
        setProducts([]);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBusiness(businessData as Business);

      const [{ data: categoryData }, { data: productData }] = await Promise.all([
        client
          .from("categories")
          .select("*")
          .eq("business_id", businessData.id)
          .eq("is_active", true)
          .order("sort_order"),
        client
          .from("products")
          .select("*")
          .eq("business_id", businessData.id)
          .eq("is_active", true)
          .order("sort_order")
      ]);

      setCategories((categoryData ?? []) as Category[]);
      setProducts((productData ?? []) as Product[]);
      setLoading(false);
    };

    load();
  }, [slug]);

  useEffect(() => {
    const client = supabase;
    if (!client || !business?.id) return;

    const channel = client
      .channel(`menu:${business.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses", filter: `id=eq.${business.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const next = payload.new as Business;
            if (!next.is_active) {
              setNotFound(true);
              setBusiness(null);
              return;
            }
            setBusiness(next);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `business_id=eq.${business.id}` },
        (payload) => {
          setCategories((current) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Category;
              if (!next.is_active) return current;
              return [...current.filter((c) => c.id !== next.id), next].sort((a, b) => a.sort_order - b.sort_order);
            }

            if (payload.eventType === "UPDATE") {
              const next = payload.new as Category;
              if (!next.is_active) return current.filter((c) => c.id !== next.id);
              return current.map((c) => c.id === next.id ? next : c).sort((a, b) => a.sort_order - b.sort_order);
            }

            const oldRow = payload.old as Partial<Category>;
            return current.filter((c) => c.id !== oldRow.id);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `business_id=eq.${business.id}` },
        (payload) => {
          setProducts((current) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Product;
              if (!next.is_active) return current;
              return [...current.filter((p) => p.id !== next.id), next].sort((a, b) => a.sort_order - b.sort_order);
            }

            if (payload.eventType === "UPDATE") {
              const next = payload.new as Product;
              if (!next.is_active) return current.filter((p) => p.id !== next.id);
              return current.map((p) => p.id === next.id ? next : p).sort((a, b) => a.sort_order - b.sort_order);
            }

            const oldRow = payload.old as Partial<Product>;
            return current.filter((p) => p.id !== oldRow.id);
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeStatus("offline");
        else setRealtimeStatus("connecting");
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [business?.id]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatches =
        activeCategory === "all" || product.category_id === activeCategory;

      const searchMatches =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query) ||
        (product.badge || "").toLowerCase().includes(query);

      return categoryMatches && searchMatches;
    });
  }, [products, search, activeCategory]);

  const featuredProducts = useMemo(
    () =>
      products
        .filter((product) => product.is_featured && !product.is_sold_out)
        .slice(0, 6),
    [products]
  );

  const categoryName = useMemo(
    () =>
      activeCategory === "all"
        ? "Todos os produtos"
        : categories.find((category) => category.id === activeCategory)?.name || "Produtos",
    [activeCategory, categories]
  );

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  };

  const addSelectedProduct = () => {
    if (!selectedProduct || selectedProduct.is_sold_out) return;
    for (let index = 0; index < selectedQuantity; index += 1) addItem(selectedProduct);
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  if (loading) {
    return (
      <main className="menu-loading-page">
        <div className="menu-loading-card">
          <span className="menu-loading-logo">🍽️</span>
          <h2>Carregando cardápio...</h2>
          <p>Preparando os produtos para você.</p>
        </div>
      </main>
    );
  }

  if (notFound || !business) {
    return (
      <main className="empty-state">
        <h2>Cardápio não encontrado</h2>
        <p>Este estabelecimento não existe ou está indisponível.</p>
      </main>
    );
  }

  const isOpen = business.is_open !== false;
  const deliveryEnabled = business.delivery_enabled !== false;
  const pickupEnabled = business.pickup_enabled !== false;
  const dineInEnabled = business.dine_in_enabled !== false;
  const deliveryFee = Number(business.delivery_fee || 0);
  const freeDeliveryAbove = Number(business.free_delivery_above || 0);
  const minimumOrder = Number(business.minimum_order || 0);

  return (
    <div
      className="menu-page menu-page-pro"
      style={{
        "--menu-primary": business.primary_color || "#ff6b00",
        "--menu-secondary": business.secondary_color || "#18120e"
      } as React.CSSProperties}
    >
      <section
        className="menu-cover menu-cover-pro"
        style={{
          backgroundImage: business.cover_url
            ? `linear-gradient(rgba(18,12,8,.08), rgba(18,12,8,.72)), url(${business.cover_url})`
            : undefined
        }}
      >
        <div className="menu-cover-overlay-content">
          <span className={`menu-open-badge ${isOpen ? "open" : "closed"}`}>
            <i />
            {isOpen ? "Aberto agora" : "Fechado no momento"}
          </span>
        </div>
      </section>

      <main className="menu-shell menu-shell-pro">
        <section className="business-head menu-business-head-pro">
          <div className="business-logo menu-business-logo-pro">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} />
            ) : (
              "🍽️"
            )}
          </div>

          <div className="business-info">
            <div className="business-title-row">
              <div>
                <h1>{business.name}</h1>
                {business.description && <p>{business.description}</p>}
              </div>

              <span className={`realtime-badge ${realtimeStatus}`}>
                <Radio size={13} />
                {realtimeStatus === "live"
                  ? "Atualizado"
                  : realtimeStatus === "connecting"
                    ? "Conectando"
                    : "Offline"}
              </span>
            </div>

            <div className="business-meta menu-business-meta-pro">
              {business.city && (
                <span>
                  <MapPin size={15} />
                  {business.city}
                  {business.state ? `/${business.state}` : ""}
                </span>
              )}

              {business.instagram && (
                <span>
                  <Instagram size={15} />
                  {business.instagram}
                </span>
              )}

              {!!business.estimated_delivery_min && (
                <span>
                  <Clock size={15} />
                  {business.estimated_delivery_min}
                  {business.estimated_delivery_max
                    ? `–${business.estimated_delivery_max}`
                    : ""}{" "}
                  min
                </span>
              )}

              <InstallAppButton compact />
            </div>
          </div>
        </section>

        <section className="menu-service-summary">
          <article className={deliveryEnabled ? "" : "disabled"}>
            <span>Entrega</span>
            <strong>{deliveryEnabled ? (deliveryFee > 0 ? formatBRL(deliveryFee) : "Grátis") : "Indisponível"}</strong>
          </article>

          <article className={pickupEnabled ? "" : "disabled"}>
            <span>Retirada</span>
            <strong>{pickupEnabled ? "Disponível" : "Indisponível"}</strong>
          </article>

          <article className={dineInEnabled ? "" : "disabled"}>
            <span>No local</span>
            <strong>{dineInEnabled ? "Disponível" : "Indisponível"}</strong>
          </article>

          <article>
            <span>Pedido mínimo</span>
            <strong>{minimumOrder > 0 ? formatBRL(minimumOrder) : "Sem mínimo"}</strong>
          </article>
        </section>

        {deliveryEnabled && freeDeliveryAbove > 0 && (
          <div className="menu-free-delivery-note">
            🚚 <strong>Entrega grátis</strong> em pedidos a partir de{" "}
            <strong>{formatBRL(freeDeliveryAbove)}</strong>.
          </div>
        )}

        {!isOpen && (
          <div className="menu-closed-alert">
            <Clock3 size={20} />
            <div>
              <strong>O estabelecimento está fechado</strong>
              <span>Você pode consultar o cardápio, mas novos pedidos estão temporariamente indisponíveis.</span>
            </div>
          </div>
        )}

        <div className="menu-tools-sticky">
          <div className="menu-search menu-search-pro">
            <Search size={19} />
            <input
              placeholder="Buscar produtos, combos, bebidas..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="category-row category-row-pro">
            <button
              className={activeCategory === "all" ? "category-chip active" : "category-chip"}
              onClick={() => setActiveCategory("all")}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={activeCategory === category.id ? "category-chip active" : "category-chip"}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {!search && activeCategory === "all" && featuredProducts.length > 0 && (
          <section className="menu-featured-section">
            <div className="menu-section-title">
              <div>
                <span className="menu-title-icon"><Star size={16} fill="currentColor" /></span>
                <div>
                  <h2>Destaques</h2>
                  <p>Os favoritos do cardápio</p>
                </div>
              </div>
            </div>

            <div className="product-grid menu-featured-grid">
              {featuredProducts.map((product) => (
                <ProductCard product={product} key={product.id} onOpen={openProduct} />
              ))}
            </div>
          </section>
        )}

        <section className="menu-products-section">
          <div className="menu-section-title">
            <div>
              <div>
                <h2>{search ? `Resultados para “${search}”` : categoryName}</h2>
                <p>
                  {filtered.length} {filtered.length === 1 ? "produto disponível" : "produtos disponíveis"}
                </p>
              </div>
            </div>
          </div>

          <section className="product-grid menu-product-grid-pro">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} onOpen={openProduct} />
            ))}
          </section>
        </section>

        {!filtered.length && (
          <div className="menu-empty-products">
            <Search size={26} />
            <h3>Nenhum produto encontrado</h3>
            <p>Tente buscar outro nome ou escolher uma categoria diferente.</p>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
            >
              Ver todo o cardápio
            </button>
          </div>
        )}

        <footer className="menu-public-footer">
          <strong>{business.name}</strong>
          <span>Cardápio digital por Menufy</span>
        </footer>
      </main>

      <CartBar />

      {selectedProduct && (
        <div
          className="menu-product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
        >
          <section className="menu-product-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="menu-product-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>

            <div className="menu-product-modal-image">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} />
              ) : (
                <span>🍽️</span>
              )}

              {selectedProduct.is_featured && (
                <span className="menu-modal-featured">
                  <Star size={12} fill="currentColor" />
                  Destaque
                </span>
              )}
            </div>

            <div className="menu-product-modal-body">
              {selectedProduct.badge && (
                <span className="menu-modal-badge">{selectedProduct.badge}</span>
              )}

              <h2>{selectedProduct.name}</h2>

              {selectedProduct.description && (
                <p>{selectedProduct.description}</p>
              )}

              {!!selectedProduct.preparation_time && (
                <span className="menu-modal-preparation">
                  <Clock3 size={15} />
                  Preparo aproximado: {selectedProduct.preparation_time} min
                </span>
              )}

              <div className="menu-modal-price">
                {selectedProduct.promotional_price != null &&
                  Number(selectedProduct.promotional_price) < Number(selectedProduct.price) && (
                    <span>{formatBRL(Number(selectedProduct.price))}</span>
                  )}
                <strong>
                  {formatBRL(Number(selectedProduct.promotional_price ?? selectedProduct.price))}
                </strong>
              </div>

              {selectedProduct.is_sold_out ? (
                <div className="menu-modal-sold-out">
                  Produto temporariamente esgotado
                </div>
              ) : !isOpen ? (
                <div className="menu-modal-sold-out">
                  Pedidos indisponíveis enquanto o estabelecimento estiver fechado
                </div>
              ) : (
                <div className="menu-modal-add-area">
                  <div className="menu-modal-qty">
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                    >
                      <Minus size={17} />
                    </button>
                    <strong>{selectedQuantity}</strong>
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((quantity) => quantity + 1)}
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <button type="button" className="button menu-modal-add" onClick={addSelectedProduct}>
                    <ShoppingBag size={17} />
                    Adicionar •{" "}
                    {formatBRL(
                      Number(selectedProduct.promotional_price ?? selectedProduct.price) *
                        selectedQuantity
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
