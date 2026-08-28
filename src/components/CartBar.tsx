import { ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";

export function CartBar() {
  const { totalItems, subtotal } = useCart();
  const { slug } = useParams();

  if (!totalItems || !slug) return null;

  return (
    <Link className="cart-bar" to={`/menu/${slug}/checkout`}>
      <span>
        <ShoppingBag size={20} />
        {totalItems} {totalItems === 1 ? "item" : "itens"}
      </span>
      <strong>{formatBRL(subtotal)}</strong>
    </Link>
  );
}
