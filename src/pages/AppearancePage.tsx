import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Palette,
  Save,
  Store,
  Upload,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { uploadBrandingAsset } from "../lib/brandingUpload";
import { supabase } from "../lib/supabase";

type BusinessAppearance = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_open?: boolean;
  delivery_enabled?: boolean;
  pickup_enabled?: boolean;
  dine_in_enabled?: boolean;
  delivery_fee?: number;
  minimum_order?: number;
  estimated_delivery_min?: number | null;
  estimated_delivery_max?: number | null;
};

type AppearanceForm = {
  logo_url: string;
  cover_url: string;
  primary_color: string;
  secondary_color: string;
  is_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dine_in_enabled: boolean;
  delivery_fee: string;
  minimum_order: string;
  estimated_delivery_min: string;
  estimated_delivery_max: string;
};

const defaultForm: AppearanceForm = {
  logo_url: "",
  cover_url: "",
  primary_color: "#ff6b00",
  secondary_color: "#18120e",
  is_open: true,
  delivery_enabled: true,
  pickup_enabled: true,
  dine_in_enabled: true,
  delivery_fee: "0",
  minimum_order: "0",
  estimated_delivery_min: "",
  estimated_delivery_max: ""
};

const appearancePresets = [
  { name: "Menufy", primary: "#ff6b00", secondary: "#18120e" },
  { name: "Premium", primary: "#c78d37", secondary: "#14110e" },
  { name: "Fresh", primary: "#2e9b63", secondary: "#143328" },
  { name: "Pizza", primary: "#c73b2f", secondary: "#241613" },
  { name: "Açaí", primary: "#7a3fa0", secondary: "#24152d" },
  { name: "Oceano", primary: "#2776c8", secondary: "#10283f" }
];

export function AppearancePage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessAppearance | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<AppearanceForm>(defaultForm);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return navigate("/login", { replace: true });

      setUserId(auth.user.id);

      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,description,logo_url,cover_url,primary_color,secondary_color,is_open,delivery_enabled,pickup_enabled,dine_in_enabled,delivery_fee,minimum_order,estimated_delivery_min,estimated_delivery_max")
        .eq("owner_id", auth.user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) return navigate("/onboarding", { replace: true });

      setBusiness(data as BusinessAppearance);
      setForm({
        logo_url: data.logo_url || "",
        cover_url: data.cover_url || "",
        primary_color: data.primary_color || "#ff6b00",
        secondary_color: data.secondary_color || "#18120e",
        is_open: data.is_open !== false,
        delivery_enabled: data.delivery_enabled !== false,
        pickup_enabled: data.pickup_enabled !== false,
        dine_in_enabled: data.dine_in_enabled !== false,
        delivery_fee: String(data.delivery_fee ?? 0),
        minimum_order: String(data.minimum_order ?? 0),
        estimated_delivery_min: data.estimated_delivery_min ? String(data.estimated_delivery_min) : "",
        estimated_delivery_max: data.estimated_delivery_max ? String(data.estimated_delivery_max) : ""
      });
    };

    load();
  }, [navigate]);

  const persistAppearance = async (
    nextForm: AppearanceForm,
    successMessage = "Aparência atualizada com sucesso."
  ) => {
    if (!supabase || !business) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("businesses")
      .update({
        logo_url: nextForm.logo_url.trim() || null,
        cover_url: nextForm.cover_url.trim() || null,
        primary_color: nextForm.primary_color,
        secondary_color: nextForm.secondary_color,
        is_open: nextForm.is_open,
        delivery_enabled: nextForm.delivery_enabled,
        pickup_enabled: nextForm.pickup_enabled,
        dine_in_enabled: nextForm.dine_in_enabled,
        delivery_fee: Number(nextForm.delivery_fee.replace(",", ".")) || 0,
        minimum_order: Number(nextForm.minimum_order.replace(",", ".")) || 0,
        estimated_delivery_min: nextForm.estimated_delivery_min ? Number(nextForm.estimated_delivery_min) : null,
        estimated_delivery_max: nextForm.estimated_delivery_max ? Number(nextForm.estimated_delivery_max) : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", business.id)
      .select("id,name,slug,description,logo_url,cover_url,primary_color,secondary_color,is_open,delivery_enabled,pickup_enabled,dine_in_enabled,delivery_fee,minimum_order,estimated_delivery_min,estimated_delivery_max")
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setBusiness(data as BusinessAppearance);
      setForm({
        logo_url: data.logo_url || "",
        cover_url: data.cover_url || "",
        primary_color: data.primary_color || "#ff6b00",
        secondary_color: data.secondary_color || "#18120e",
        is_open: data.is_open !== false,
        delivery_enabled: data.delivery_enabled !== false,
        pickup_enabled: data.pickup_enabled !== false,
        dine_in_enabled: data.dine_in_enabled !== false,
        delivery_fee: String(data.delivery_fee ?? 0),
        minimum_order: String(data.minimum_order ?? 0),
        estimated_delivery_min: data.estimated_delivery_min ? String(data.estimated_delivery_min) : "",
        estimated_delivery_max: data.estimated_delivery_max ? String(data.estimated_delivery_max) : ""
      });
      setMessage(successMessage);
    }

    setSaving(false);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    await persistAppearance(form);
  };

  const handleUpload = async (kind: "logo" | "cover", file?: File | null) => {
    if (!file || !business || !userId) return;

    setMessage("");

    try {
      kind === "logo" ? setUploadingLogo(true) : setUploadingCover(true);

      const publicUrl = await uploadBrandingAsset({
        file,
        businessId: business.id,
        userId,
        kind
      });

      const nextForm = {
        ...form,
        [kind === "logo" ? "logo_url" : "cover_url"]: publicUrl
      } as AppearanceForm;

      setForm(nextForm);
      await persistAppearance(
        nextForm,
        kind === "logo"
          ? "Logo atualizada com sucesso."
          : "Imagem de capa atualizada com sucesso."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível enviar a imagem."
      );
    } finally {
      kind === "logo" ? setUploadingLogo(false) : setUploadingCover(false);
    }
  };

  const removeAsset = async (kind: "logo" | "cover") => {
    const nextForm = {
      ...form,
      [kind === "logo" ? "logo_url" : "cover_url"]: ""
    } as AppearanceForm;

    setForm(nextForm);

    await persistAppearance(
      nextForm,
      kind === "logo"
        ? "Logo removida com sucesso."
        : "Imagem de capa removida com sucesso."
    );
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Personalização</span>
          <h1>Aparência</h1>
          <p className="dashboard-subtitle">
            Atualize logo, imagem de capa e cores do seu cardápio.
          </p>
        </div>

        {business && (
          <Link className="button button-outline" to={`/menu/${business.slug}`}>
            Ver cardápio <ExternalLink size={17} />
          </Link>
        )}
      </header>

      {!business ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <div className="appearance-layout">
          <section className="dashboard-panel">
            <div className="appearance-section-title">
              <ImagePlus size={18} />
              Logo e imagem de capa
            </div>

            <div className="branding-upload-grid">
              <article className="branding-upload-card">
                <div className="branding-upload-preview branding-upload-preview-logo">
                  {form.logo_url ? <img src={form.logo_url} alt="Logo" /> : <span>🍽️</span>}
                </div>

                <div className="branding-upload-content">
                  <strong>Logo do estabelecimento</strong>
                  <p>
                    Envie sua logo em PNG, JPG, WEBP ou SVG.
                    Recomendado: formato quadrado.
                  </p>

                  <div className="branding-upload-actions">
                    <label className="button button-outline">
                      <Upload size={16} />
                      {uploadingLogo ? "Enviando..." : "Enviar logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        hidden
                        disabled={uploadingLogo || saving}
                        onChange={(event) =>
                          handleUpload("logo", event.target.files?.[0] || null)
                        }
                      />
                    </label>

                    {form.logo_url && (
                      <button
                        type="button"
                        className="button button-outline danger-outline"
                        disabled={saving}
                        onClick={() => removeAsset("logo")}
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </article>

              <article className="branding-upload-card">
                <div
                  className="branding-upload-preview branding-upload-preview-cover"
                  style={{
                    backgroundImage: form.cover_url
                      ? `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.38)), url(${form.cover_url})`
                      : undefined,
                    backgroundColor: form.secondary_color
                  }}
                >
                  {!form.cover_url && <span>Imagem de capa</span>}
                </div>

                <div className="branding-upload-content">
                  <strong>Imagem de capa</strong>
                  <p>
                    Ideal para destacar seu cardápio. Recomendado formato retangular.
                  </p>

                  <div className="branding-upload-actions">
                    <label className="button button-outline">
                      <Upload size={16} />
                      {uploadingCover ? "Enviando..." : "Enviar capa"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        hidden
                        disabled={uploadingCover || saving}
                        onChange={(event) =>
                          handleUpload("cover", event.target.files?.[0] || null)
                        }
                      />
                    </label>

                    {form.cover_url && (
                      <button
                        type="button"
                        className="button button-outline danger-outline"
                        disabled={saving}
                        onClick={() => removeAsset("cover")}
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </div>

            <form className="form-grid appearance-form-extended" onSubmit={save}>
              <label className="full">
                URL da logo
                <input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                />
                <small>Opcional: use uma URL externa se preferir.</small>
              </label>

              <label className="full">
                URL da imagem de capa
                <input
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="https://..."
                />
                <small>Opcional: também pode colar uma URL pública.</small>
              </label>

              <label>
                Cor principal
                <div className="color-input-row">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  />
                  <input
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  />
                </div>
              </label>

              <label>
                Cor secundária
                <div className="color-input-row">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  />
                  <input
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  />
                </div>
              </label>

              {message && <div className="form-message">{message}</div>}

              <button className="button button-large full" disabled={saving}>
                <Save size={18} />
                {saving ? "Salvando..." : "Salvar aparência"}
              </button>
            </form>
          </section>

          <section className="appearance-preview-card">
            <div className="appearance-preview-title">
              <Palette size={18} />
              Prévia do cardápio
            </div>

            <div
              className="appearance-preview-cover"
              style={{
                backgroundImage: form.cover_url
                  ? `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.40)), url(${form.cover_url})`
                  : undefined,
                backgroundColor: form.secondary_color
              }}
            />

            <div className="appearance-preview-body">
              <div className="appearance-preview-brand">
                <div className="appearance-preview-logo">
                  {form.logo_url ? <img src={form.logo_url} alt="" /> : "🍽️"}
                </div>
                <div>
                  <h3>{business.name}</h3>
                  <p>{business.description || "Seu cardápio digital."}</p>
                </div>
              </div>

              <div className="appearance-preview-product">
                <div>
                  <strong>Produto de exemplo</strong>
                  <span>Descrição do produto</span>
                  <b style={{ color: form.primary_color }}>R$ 29,90</b>
                </div>

                <button style={{ background: form.primary_color }}>+</button>
              </div>

              <div
                className="appearance-preview-cart"
                style={{ background: form.secondary_color }}
              >
                <span>🛒 2 itens</span>
                <strong>R$ 59,80</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
