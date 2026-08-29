import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <Logo />
        <span className="not-found-code">404</span>
        <h1>Página não encontrada</h1>
        <p>
          Esta rota não existe nesta versão do Menufy ou ainda não foi publicada no Netlify.
        </p>

        <div className="not-found-actions">
          <Link className="button" to="/">
            <Home size={17} /> Ir para o início
          </Link>
          <button className="button button-outline" onClick={() => history.back()}>
            <ArrowLeft size={17} /> Voltar
          </button>
        </div>
      </div>
    </main>
  );
}
