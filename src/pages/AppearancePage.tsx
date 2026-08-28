import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Palette, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
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
};

export function AppearancePage() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessAppearance | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    logo_url: "",
    cover_url: "",
    primary_color: "#ff6b00",
    secondary_color: "#18120e"
  });

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return navigate("/login", { replace: true });

      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,description,logo_url,cover_url,primary_color,secondary_color")
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
        secondary_color: data.secondary_color || "#18120e"
      });
    };

    load();
  }, [navigate]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !business) return;

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("businesses")
      .update({
        logo_url: form.logo_url.trim() || null,
        cover_url: form.cover_url.trim() || null,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        updated_at: new Date().toISOString()
      })
      .eq("id", business.id)
      .select("id,name,slug,description,logo_url,cover_url,primary_color,secondary_color")
      .single();

    if (error) setMessage(error.message);
    else {
      setBusiness(data as BusinessAppearance);
      setMessage("Aparência atualizada com sucesso.");
    }

    setSaving(false);
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Personalização</span>
          <h1>Aparência</h1>
          <p className="dashboard-subtitle">
            Personalize a identidade visual do seu cardápio.
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
            <form className="form-grid" onSubmit={save}>
              <label className="full">
                URL da logo
                <input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </label>

              <label className="full">
                URL da imagem de capa
                <input
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="https://..."
                />
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
              Prévia
            </div>

            <div
              className="appearance-preview-cover"
              style={{
                backgroundImage: form.cover_url ? `url(${form.cover_url})` : undefined,
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
