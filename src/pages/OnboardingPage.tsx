import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [business, setBusiness] = useState({
    name: "",
    slug: "",
    description: "",
    whatsapp: "",
    instagram: "",
    city: "",
    state: "",
    logo_url: "",
    cover_url: ""
  });

  const [category, setCategory] = useState({
    name: "Hambúrgueres"
  });

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_url: ""
  });

  useEffect(() => {
    const boot = async () => {
      if (!supabase) {
        setMessage("Supabase não configurado.");
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/login", { replace: true });
        return;
      }

      setUserId(data.user.id);

      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        navigate("/dashboard", { replace: true });
      }
    };

    boot();
  }, [navigate]);

  useEffect(() => {
    if (business.name && !business.slug) {
      setBusiness((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [business.name]);

  const previewSlug = useMemo(() => slugify(business.slug || business.name), [business.slug, business.name]);

  const createBusiness = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !userId) return;

    setSaving(true);
    setMessage("");

    let desiredSlug = slugify(business.slug || business.name);

    if (!desiredSlug) {
      setMessage("Informe um nome válido para gerar o link.");
      setSaving(false);
      return;
    }

    const payload = {
      owner_id: userId,
      name: business.name.trim(),
      slug: desiredSlug,
      description: business.description.trim() || null,
      whatsapp: business.whatsapp.replace(/\D/g, ""),
      instagram: business.instagram.trim() || null,
      city: business.city.trim() || null,
      state: business.state.trim().toUpperCase() || null,
      logo_url: business.logo_url.trim() || null,
      cover_url: business.cover_url.trim() || null,
      is_active: true
    };

    let result = await supabase
      .from("businesses")
      .insert(payload)
      .select("id,slug")
      .single();

    if (result.error?.code === "23505") {
      desiredSlug = `${desiredSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      result = await supabase
        .from("businesses")
        .insert({ ...payload, slug: desiredSlug })
        .select("id,slug")
        .single();
    }

    if (result.error || !result.data) {
      setMessage(result.error?.message || "Não foi possível criar o estabelecimento.");
      setSaving(false);
      return;
    }

    setBusinessId(result.data.id);
    setBusiness((prev) => ({ ...prev, slug: result.data.slug }));
    setStep(2);
    setSaving(false);
  };

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !businessId) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        business_id: businessId,
        name: category.name.trim(),
        sort_order: 1,
        is_active: true
      })
      .select("id")
      .single();

    if (error || !data) {
      setMessage(error?.message || "Não foi possível criar a categoria.");
      setSaving(false);
      return;
    }

    sessionStorage.setItem("menufy_onboarding_category_id", data.id);
    setStep(3);
    setSaving(false);
  };

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !businessId) return;

    const categoryId = sessionStorage.getItem("menufy_onboarding_category_id");
    if (!categoryId) {
      setMessage("Categoria inicial não encontrada.");
      return;
    }

    const numericPrice = Number(product.price.replace(",", "."));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setMessage("Preço inválido.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        category_id: categoryId,
        name: product.name.trim(),
        description: product.description.trim() || null,
        price: numericPrice,
        image_url: product.image_url.trim() || null,
        is_active: true,
        is_featured: true,
        sort_order: 1
      });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    sessionStorage.removeItem("menufy_onboarding_category_id");
    setStep(4);
    setSaving(false);
  };

  return (
    <main className="onboarding-page">
      <div className="onboarding-card">
        <Logo />

        <div className="onboarding-progress">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={step >= n ? "active" : ""}>{n}</span>
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="onboarding-icon"><Store size={30} /></div>
            <h1>Crie seu estabelecimento</h1>
            <p>Esses dados serão usados no seu cardápio público.</p>

            <form className="form-grid" onSubmit={createBusiness}>
              <label className="full">
                Nome do estabelecimento
                <input
                  required
                  value={business.name}
                  onChange={(e) => setBusiness({ ...business, name: e.target.value, slug: "" })}
                  placeholder="Ex.: Burger Prime"
                />
              </label>

              <label className="full">
                Link do cardápio
                <div className="slug-input">
                  <span>/menu/</span>
                  <input
                    required
                    value={business.slug}
                    onChange={(e) => setBusiness({ ...business, slug: slugify(e.target.value) })}
                    placeholder="burger-prime"
                  />
                </div>
                {previewSlug && <small>Seu link: /menu/{previewSlug}</small>}
              </label>

              <label className="full">
                Descrição
                <textarea
                  value={business.description}
                  onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                  placeholder="Conte um pouco sobre seu negócio."
                />
              </label>

              <label>
                WhatsApp
                <input
                  required
                  value={business.whatsapp}
                  onChange={(e) => setBusiness({ ...business, whatsapp: e.target.value })}
                  placeholder="5517999999999"
                />
              </label>

              <label>
                Instagram
                <input
                  value={business.instagram}
                  onChange={(e) => setBusiness({ ...business, instagram: e.target.value })}
                  placeholder="@seunegocio"
                />
              </label>

              <label>
                Cidade
                <input
                  value={business.city}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                />
              </label>

              <label>
                Estado
                <input
                  maxLength={2}
                  value={business.state}
                  onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                  placeholder="SP"
                />
              </label>

              {message && <div className="form-message">{message}</div>}

              <button className="button button-large button-full full" disabled={saving}>
                {saving ? "Criando..." : "Criar estabelecimento"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Crie sua primeira categoria</h1>
            <p>Você poderá criar quantas categorias quiser depois.</p>

            <form className="form-grid" onSubmit={createCategory}>
              <label className="full">
                Nome da categoria
                <input
                  required
                  value={category.name}
                  onChange={(e) => setCategory({ name: e.target.value })}
                />
              </label>

              {message && <div className="form-message">{message}</div>}

              <button className="button button-large button-full full" disabled={saving}>
                {saving ? "Salvando..." : "Continuar"}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Adicione seu primeiro produto</h1>
            <p>Esse produto já aparecerá no seu cardápio.</p>

            <form className="form-grid" onSubmit={createProduct}>
              <label className="full">
                Nome
                <input
                  required
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  placeholder="X-Bacon"
                />
              </label>

              <label className="full">
                Descrição
                <textarea
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                />
              </label>

              <label>
                Preço
                <input
                  required
                  inputMode="decimal"
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  placeholder="29,90"
                />
              </label>

              <label>
                URL da imagem
                <input
                  value={product.image_url}
                  onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </label>

              {message && <div className="form-message">{message}</div>}

              <button className="button button-large button-full full" disabled={saving}>
                {saving ? "Salvando..." : "Finalizar configuração"}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="onboarding-success">
            <CheckCircle2 size={72} />
            <h1>Seu cardápio está pronto!</h1>
            <p>Agora você já pode administrar seu negócio e compartilhar o link.</p>
            <div className="onboarding-actions">
              <button className="button button-large" onClick={() => navigate("/dashboard")}>
                Ir para o painel
              </button>
              <button className="button button-outline button-large" onClick={() => navigate(`/menu/${business.slug}`)}>
                Abrir cardápio
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
