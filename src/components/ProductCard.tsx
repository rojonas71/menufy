import { Clock3, Plus, Star } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";
import type { Product } from "../types";

export function ProductCard({
  product,
  onOpen
}: {
  product: Product;
  onOpen?: (product: Product) => void;
}) {
  const { addItem } = useCart();
  const price = product.promotional_price ?? product.price;
  const hasPromo =
    product.promotional_price !== null &&
    product.promotional_price !== undefined &&
    Number(product.promotional_price) < Number(product.price);

  return (
    <article
      className={`product-card menu-product-card ${product.is_sold_out ? "sold-out" : ""}`}
      onClick={() => onOpen?.(product)}
    >
      <div className="menu-product-image-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="menu-product-no-image">🍽️</div>
        )}

        <div className="menu-product-badges">
          {product.is_featured && (
            <span className="menu-product-badge featured">
              <Star size={11} fill="currentColor" />
              Destaque
            </span>
          )}
          {product.badge && (
            <span className="menu-product-badge custom">{product.badge}</span>
          )}
          {hasPromo && (
            <span className="menu-product-badge promo">Oferta</span>
          )}
        </div>

        {product.is_sold_out && (
          <div className="menu-product-sold-out">Esgotado</div>
        )}
      </div>

      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          {product.description && <p>{product.description}</p>}

          {!!product.preparation_time && (
            <span className="menu-product-time">
              <Clock3 size={13} />
              ~{product.preparation_time} min
            </span>
          )}
        </div>

        <div className="product-card-footer">
          <div>
            {hasPromo && (
              <span className="old-price">{formatBRL(Number(product.price))}</span>
            )}
            <strong>{formatBRL(Number(price))}</strong>
          </div>

          <button
            type="button"
            className="icon-button menu-add-button"
            disabled={product.is_sold_out}
            onClick={(event) => {
              event.stopPropagation();
              if (!product.is_sold_out) addItem(product);
            }}
            aria-label={
              product.is_sold_out
                ? `${product.name} esgotado`
                : `Adicionar ${product.name}`
            }
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
