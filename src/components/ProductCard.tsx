import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";
import type { Product } from "../types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const price = product.promotional_price ?? product.price;

  return (
    <article className="product-card">
      <img
        src={product.image_url || "https://picsum.photos/seed/menu/800/600"}
        alt={product.name}
      />
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>

        <div className="product-card-footer">
          <div>
            {product.promotional_price && (
              <span className="old-price">{formatBRL(product.price)}</span>
            )}
            <strong>{formatBRL(price)}</strong>
          </div>
          <button className="icon-button" onClick={() => addItem(product)} aria-label={`Adicionar ${product.name}`}>
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
