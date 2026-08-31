import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Palette,
  Printer,
  QrCode,
  Share2,
  Smartphone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";

type BusinessMini = {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
  logo_url?: string | null;
};

export function QrCodePage() {
  const navigate = useNavigate();
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [message, setMessage] = useState("");
  const [qrColor, setQrColor] = useState("#18120e");
  const [qrBackground, setQrBackground] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(280);
  const [caption, setCaption] = useState("Escaneie e veja nosso cardápio");

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return navigate("/login", { replace: true });

      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,primary_color,logo_url")
        .eq("owner_id", auth.user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) return navigate("/onboarding", { replace: true });

      setBusiness(data as BusinessMini);
      if (data.primary_color) setQrColor(data.primary_color);
    };

    load();
  }, [navigate]);

  const menuUrl = useMemo(() => {
    if (!business) return "";
    return `${window.location.origin}/menu/${business.slug}`;
  }, [business]);

  const copyLink = async () => {
    if (!menuUrl) return;
    await navigator.clipboard.writeText(menuUrl);
    setMessage("Link copiado para a área de transferência.");
  };

  const share = async () => {
    if (!menuUrl || !business) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cardápio ${business.name}`,
          text: `Confira o cardápio de ${business.name}`,
          url: menuUrl
        });
        return;
      } catch {
        return;
      }
    }

    await copyLink();
  };

  const svgSource = () => {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("width", String(qrSize));
    clone.setAttribute("height", String(qrSize));

    return new XMLSerializer().serializeToString(clone);
  };

  const downloadSvg = () => {
    const source = svgSource();
    if (!source || !business) return;

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qrcode-${business.slug}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const source = svgSource();
    if (!source || !business) return;

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 1400;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = qrBackground;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);

      const pngUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = pngUrl;
      anchor.download = `qrcode-${business.slug}.png`;
      anchor.click();

      URL.revokeObjectURL(svgUrl);
    };

    image.src = svgUrl;
  };

  const printQr = () => window.print();

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Compartilhamento</span>
          <h1>QR Code</h1>
          <p className="dashboard-subtitle">
            Personalize, baixe, imprima e compartilhe o acesso ao seu cardápio.
          </p>
        </div>

        {business && (
          <Link className="button button-outline" to={`/menu/${business.slug}`}>
            Abrir cardápio <ExternalLink size={17} />
          </Link>
        )}
      </header>

      {!business ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <>
          <section className="mini-stat-grid qr-mini-stats">
            <article><Link2 size={17} /><span>Link</span><strong>Ativo</strong><small>/menu/{business.slug}</small></article>
            <article><QrCode size={17} /><span>Formato</span><strong>Alta qualidade</strong><small>PNG + SVG</small></article>
            <article><Smartphone size={17} /><span>Uso</span><strong>Mobile</strong><small>Leitura instantânea</small></article>
            <article><Printer size={17} /><span>Impressão</span><strong>Pronto</strong><small>Mesas e balcão</small></article>
          </section>

          <div className="qr-pro-layout">
            <section className="dashboard-panel qr-card-panel">
              <div className="qr-print-card qr-print-card-pro">
                <div className="qr-brand">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt="" />
                  ) : (
                    <QrCode size={24} />
                  )}
                  <strong>{business.name}</strong>
                </div>

                <h2>{caption || "Escaneie e veja nosso cardápio"}</h2>
                <p>Escolha seus produtos e faça seu pedido pelo celular.</p>

                <div
                  className="qr-code-box qr-code-box-pro"
                  ref={svgWrapperRef}
                  style={{ backgroundColor: qrBackground }}
                >
                  <QRCodeSVG
                    value={menuUrl}
                    size={qrSize}
                    level="H"
                    includeMargin
                    fgColor={qrColor}
                    bgColor={qrBackground}
                  />
                </div>

                <span className="qr-public-url">{menuUrl}</span>

                <div className="qr-print-footer">
                  <Check size={13} />
                  Cardápio digital por Menufy
                </div>
              </div>
            </section>

            <section className="dashboard-panel qr-actions-panel qr-pro-actions">
              <div>
                <span className="eyebrow">Personalização</span>
                <h2>Configure seu QR Code</h2>
                <p>Ajuste a aparência antes de baixar ou imprimir.</p>
              </div>

              <label className="qr-setting-field">
                Texto do material
                <input
                  value={caption}
                  maxLength={60}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </label>

              <div className="qr-color-grid">
                <label>
                  <span><Palette size={14} /> Cor do QR</span>
                  <div>
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(event) => setQrColor(event.target.value)}
                    />
                    <input
                      value={qrColor}
                      onChange={(event) => setQrColor(event.target.value)}
                    />
                  </div>
                </label>

                <label>
                  <span>Fundo</span>
                  <div>
                    <input
                      type="color"
                      value={qrBackground}
                      onChange={(event) => setQrBackground(event.target.value)}
                    />
                    <input
                      value={qrBackground}
                      onChange={(event) => setQrBackground(event.target.value)}
                    />
                  </div>
                </label>
              </div>

              <label className="qr-setting-field">
                Tamanho de visualização
                <select
                  value={qrSize}
                  onChange={(event) => setQrSize(Number(event.target.value))}
                >
                  <option value={220}>Compacto</option>
                  <option value={280}>Padrão</option>
                  <option value={340}>Grande</option>
                </select>
              </label>

              <div className="qr-link-box">
                <span>{menuUrl}</span>
                <button onClick={copyLink} title="Copiar link"><Copy size={17} /></button>
              </div>

              <div className="qr-action-grid qr-action-grid-pro">
                <button className="button button-large" onClick={downloadPng}>
                  <Download size={18} /> PNG
                </button>

                <button className="button button-outline button-large" onClick={downloadSvg}>
                  <Download size={18} /> SVG
                </button>

                <button className="button button-outline button-large" onClick={share}>
                  <Share2 size={18} /> Compartilhar
                </button>

                <button className="button button-outline button-large" onClick={printQr}>
                  <Printer size={18} /> Imprimir
                </button>
              </div>

              {message && <div className="form-message">{message}</div>}
            </section>
          </div>

          <section className="dashboard-panel qr-ideas-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Ideias de uso</span>
                <h2>Onde colocar seu QR Code</h2>
              </div>
            </div>

            <div className="qr-use-cases qr-use-cases-pro">
              <article>
                <strong>🪑 Mesas</strong>
                <span>Cliente abre o cardápio sem precisar pedir um menu físico.</span>
              </article>
              <article>
                <strong>🧾 Comandas</strong>
                <span>Facilite o acesso em atendimento presencial.</span>
              </article>
              <article>
                <strong>📦 Embalagens</strong>
                <span>Transforme pedidos atuais em novos pedidos futuros.</span>
              </article>
              <article>
                <strong>📱 Instagram</strong>
                <span>Publique em stories ou materiais da bio.</span>
              </article>
              <article>
                <strong>🪧 Balcão</strong>
                <span>Exponha perto do caixa ou área de retirada.</span>
              </article>
              <article>
                <strong>📄 Panfletos</strong>
                <span>Leve o cliente diretamente para o cardápio atualizado.</span>
              </article>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  );
}
