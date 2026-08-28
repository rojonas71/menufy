import { useEffect, useMemo, useState } from "react";
import { Clock, Instagram, MapPin, Radio, Search } from "lucide-react";
import { useParams } from "react-router-dom";
import { CartBar } from "../components/CartBar";
import { InstallAppButton } from "../components/InstallAppButton";
import { ProductCard } from "../components/ProductCard";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Business, Category, Product } from "../types";

export function MenuPage() {
  const { slug = "" } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
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
    return products.filter((product) => {
      const categoryMatches = activeCategory === "all" || product.category_id === activeCategory;
      const searchMatches =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(search.toLowerCase());
      return categoryMatches && searchMatches;
    });
  }, [products, search, activeCategory]);

  if (loading) {
    return <main className="empty-state"><h2>Carregando cardápio...</h2></main>;
  }

  if (notFound || !business) {
    return (
      <main className="empty-state">
        <h2>Cardápio não encontrado</h2>
        <p>Este estabelecimento não existe ou está indisponível.</p>
      </main>
    );
  }

  return (
    <div className="menu-page" style={{ "--menu-primary": business.primary_color || "#ff6b00", "--menu-secondary": business.secondary_color || "#18120e" } as React.CSSProperties}>
      <section
        className="menu-cover"
        style={{
          backgroundImage: business.cover_url
            ? `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.55)), url(${business.cover_url})`
            : undefined
        }}
      />

      <main className="menu-shell">
        <section className="business-head">
          <div className="business-logo">
            {business.logo_url ? <img src={business.logo_url} alt={business.name} /> : "🍽️"}
          </div>

          <div className="business-info">
            <div className="business-title-row">
              <h1>{business.name}</h1>
              <span className={`realtime-badge ${realtimeStatus}`}>
                <Radio size={13} />
                {realtimeStatus === "live" ? "Ao vivo" : realtimeStatus === "connecting" ? "Conectando" : "Offline"}
              </span>
            </div>

            {business.description && <p>{business.description}</p>}

            <div className="business-meta">
              <span><Clock size={16} /> Cardápio online</span>
              {business.city && <span><MapPin size={16} /> {business.city}/{business.state}</span>}
              {business.instagram && <span><Instagram size={16} /> {business.instagram}</span>}
              <InstallAppButton compact />
            </div>
          </div>
        </section>

        <div className="menu-search">
          <Search size={19} />
          <input
            placeholder="Buscar no cardápio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-row">
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

        <section className="product-grid">
          {filtered.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </section>

        {!filtered.length && (
          <div className="empty-state">Nenhum produto disponível.</div>
        )}
      </main>

      <CartBar />
    </div>
  );
}
