import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { supabase } from "../lib/supabase";

type BusinessMini = {
  id: string;
  name: string;
  slug: string;
  primary_color: string | null;
};

export function QrCodePage() {
  const navigate = useNavigate();
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [business, setBusiness] = useState<BusinessMini | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return navigate("/login", { replace: true });

      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,slug,primary_color")
        .eq("owner_id", auth.user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) return navigate("/onboarding", { replace: true });

      setBusiness(data as BusinessMini);
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
    setMessage("Link copiado.");
  };

  const downloadSvg = () => {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg || !business) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${business.slug}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg || !business) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(blob);

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 1200;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `qrcode-${business.slug}.png`;
      a.click();

      URL.revokeObjectURL(svgUrl);
    };

    image.src = svgUrl;
  };

  return (
    <DashboardShell>
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Compartilhamento</span>
          <h1>QR Code</h1>
          <p className="dashboard-subtitle">
            Use nas mesas, balcão, embalagens e redes sociais.
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
        <div className="qr-layout">
          <section className="dashboard-panel qr-card-panel">
            <div className="qr-print-card">
              <div className="qr-brand">
                <QrCode size={24} />
                <strong>{business.name}</strong>
              </div>

              <h2>Escaneie e veja nosso cardápio</h2>
              <p>Escolha seus produtos e faça seu pedido pelo celular.</p>

              <div className="qr-code-box" ref={svgWrapperRef}>
                <QRCodeSVG
                  value={menuUrl}
                  size={260}
                  level="H"
                  includeMargin
                  fgColor="#18120e"
                  bgColor="#ffffff"
                />
              </div>

              <span className="qr-public-url">{menuUrl}</span>
            </div>
          </section>

          <section className="dashboard-panel qr-actions-panel">
            <h2>Seu QR Code está pronto</h2>
            <p>
              Compartilhe o link ou baixe o QR Code em alta qualidade.
            </p>

            <div className="qr-link-box">
              <span>{menuUrl}</span>
              <button onClick={copyLink}><Copy size={17} /></button>
            </div>

            <div className="qr-action-grid">
              <button className="button button-large" onClick={downloadPng}>
                <Download size={18} /> Baixar PNG
              </button>

              <button className="button button-outline button-large" onClick={downloadSvg}>
                <Download size={18} /> Baixar SVG
              </button>
            </div>

            <div className="qr-use-cases">
              <article>
                <strong>🪑 Mesa</strong>
                <span>Cliente acessa o cardápio sem chamar atendimento.</span>
              </article>
              <article>
                <strong>📦 Embalagem</strong>
                <span>Facilite o próximo pedido do cliente.</span>
              </article>
              <article>
                <strong>📱 Instagram</strong>
                <span>Use o link do cardápio na bio e nos stories.</span>
              </article>
            </div>

            {message && <div className="form-message">{message}</div>}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
