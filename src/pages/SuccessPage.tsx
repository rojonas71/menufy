import { CheckCircle2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

export function SuccessPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();

  return (
    <main className="success-page">
      <CheckCircle2 size={70} />
      <h1>Pedido criado!</h1>
      <p>Pedido #{params.get("pedido") || "—"} enviado para o estabelecimento.</p>
      <Link className="button" to={`/menu/${slug}`}>Voltar ao cardápio</Link>
    </main>
  );
}
