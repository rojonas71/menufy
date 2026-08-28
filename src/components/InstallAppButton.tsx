import { Download, Smartphone } from "lucide-react";
import { useState } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const { canInstall, isInstalled, isIos, install } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await install();
      return;
    }

    setShowHelp(true);
  };

  return (
    <>
      <button
        type="button"
        className={compact ? "install-app-button compact" : "install-app-button"}
        onClick={handleInstall}
      >
        {compact ? <Download size={17} /> : <Smartphone size={19} />}
        {compact ? "Instalar" : "Instalar aplicativo"}
      </button>

      {showHelp && (
        <div className="install-help-overlay" onClick={() => setShowHelp(false)}>
          <div className="install-help-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="install-help-close"
              type="button"
              onClick={() => setShowHelp(false)}
            >
              ×
            </button>

            <Smartphone size={36} />
            <h3>Instalar Menufy</h3>

            {isIos ? (
              <p>
                No Safari, toque em <strong>Compartilhar</strong> e depois em
                <strong> Adicionar à Tela de Início</strong>.
              </p>
            ) : (
              <p>
                Abra o site no Chrome ou Edge e use a opção
                <strong> Instalar aplicativo</strong> no menu do navegador.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
