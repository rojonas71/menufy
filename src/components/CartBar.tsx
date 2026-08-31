import { ChevronRight, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";

export function CartBar() {
  const { totalItems, subtotal } = useCart();
  const { slug } = useParams();

  if (!totalItems || !slug) return null;

  return (
    <div className="cart-bar-shell">
      <Link className="cart-bar menu-cart-bar" to={`/menu/${slug}/checkout`}>
        <span className="menu-cart-count">
          <i>{totalItems}</i>
          <span>
            <strong>Ver carrinho</strong>
            <small>
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </small>
          </span>
        </span>

        <span className="menu-cart-total">
          <strong>{formatBRL(subtotal)}</strong>
          <ChevronRight size={18} />
        </span>
      </Link>
    </div>
  );
}
