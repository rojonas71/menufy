import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/money";
import { supabase } from "../lib/supabase";
import type { Business, CheckoutData } from "../types";

export function CheckoutPage() {
  const { slug = "" } = useParams();
  const { items, subtotal, addItem, decreaseItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState<CheckoutData>({
    customer_name: "",
    customer_phone: "",
    order_type: "delivery",
    payment_method: "pix",
    address: "",
    notes: ""
  });

  useEffect(() => {
    const loadBusiness = async () => {
      if (!supabase || !slug) {
        setErrorMessage("Supabase não configurado.");
        setLoadingBusiness(false);
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage("Estabelecimento não encontrado.");
        setBusiness(null);
      } else {
        setBusiness(data as Business);
      }

      setLoadingBusiness(false);
    };

    loadBusiness();
  }, [slug]);

  const deliveryFee = form.order_type === "delivery" ? 5 : 0;
  const total = subtotal + deliveryFee;

  const update = (field: keyof CheckoutData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length || !business || !supabase) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          business_id: business.id,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          order_type: form.order_type,
          payment_method: form.payment_method,
          delivery_address: form.order_type === "delivery" ? form.address : null,
          notes: form.notes || null,
          subtotal,
          delivery_fee: deliveryFee,
          discount: 0,
          total,
          status: "new"
        })
        .select("id, order_number")
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Não foi possível criar o pedido.");
      }

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          unit_price: item.product.promotional_price ?? item.product.price,
          quantity: item.quantity,
          subtotal: (item.product.promotional_price ?? item.product.price) * item.quantity
        }))
      );

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      const lines = [
        `🍽️ *NOVO PEDIDO - ${business.name}*`,
        `Pedido #${orderData.order_number}`,
        "",
        `Cliente: ${form.customer_name}`,
        `Telefone: ${form.customer_phone}`,
        "",
        "------------------",
        ...items.flatMap((item) => [
          `${item.quantity}x ${item.product.name}`,
          formatBRL((item.product.promotional_price ?? item.product.price) * item.quantity)
        ]),
        "------------------",
        `Subtotal: ${formatBRL(subtotal)}`,
        `Entrega: ${formatBRL(deliveryFee)}`,
        `*TOTAL: ${formatBRL(total)}*`,
        "",
        `Pagamento: ${form.payment_method === "pix" ? "PIX" : form.payment_method === "cash" ? "Dinheiro" : "Cartão"}`,
        `Tipo: ${form.order_type === "delivery" ? "Entrega" : form.order_type === "pickup" ? "Retirada" : "Consumir no local"}`,
        form.order_type === "delivery" ? `Endereço: ${form.address}` : "",
        form.notes ? `Observação: ${form.notes}` : ""
      ].filter(Boolean);

      const whatsapp = business.whatsapp.replace(/\D/g, "");
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;

      clearCart();
      window.open(url, "_blank", "noopener,noreferrer");
      navigate(`/menu/${slug}/sucesso?pedido=${orderData.order_number}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao finalizar pedido.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingBusiness) {
    return <main className="empty-state"><h2>Carregando...</h2></main>;
  }

  if (!business) {
    return (
      <main className="checkout-page container narrow">
        <div className="empty-state">
          <h2>Não foi possível carregar o estabelecimento</h2>
          <p>{errorMessage}</p>
          <Link className="button" to={`/menu/${slug}`}>Voltar</Link>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="checkout-page container narrow">
        <Link className="back-link" to={`/menu/${slug}`}><ArrowLeft size={18} /> Voltar</Link>
        <div className="empty-state">
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione produtos para continuar.</p>
          <Link className="button" to={`/menu/${slug}`}>Ver cardápio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page container narrow">
      <Link className="back-link" to={`/menu/${slug}`}>
        <ArrowLeft size={18} /> Voltar ao cardápio
      </Link>

      <h1>Finalizar pedido</h1>

      <section className="checkout-section">
        <h2>Seu pedido</h2>

        {items.map((item) => (
          <div className="checkout-item" key={item.product.id}>
            <div>
              <strong>{item.product.name}</strong>
              <span>{formatBRL(item.product.promotional_price ?? item.product.price)}</span>
            </div>

            <div className="qty-control">
              <button onClick={() => decreaseItem(item.product.id)}><Minus size={16} /></button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem(item.product)}><Plus size={16} /></button>
              <button className="danger-button" onClick={() => removeItem(item.product.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <form onSubmit={submit}>
        <section className="checkout-section form-grid">
          <h2>Seus dados</h2>

          <label>
            Nome
            <input required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
          </label>

          <label>
            Telefone
            <input required value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} />
          </label>

          <label>
            Tipo do pedido
            <select value={form.order_type} onChange={(e) => update("order_type", e.target.value)}>
              <option value="delivery">Entrega</option>
              <option value="pickup">Retirada</option>
              <option value="local">Consumir no local</option>
            </select>
          </label>

          <label>
            Pagamento
            <select value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
            </select>
          </label>

          {form.order_type === "delivery" && (
            <label className="full">
              Endereço
              <input required value={form.address} onChange={(e) => update("address", e.target.value)} />
            </label>
          )}

          <label className="full">
            Observações
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Ex.: sem cebola..."
            />
          </label>

          {errorMessage && <div className="form-message">{errorMessage}</div>}
        </section>

        <section className="checkout-summary">
          <div><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
          <div><span>Entrega</span><strong>{formatBRL(deliveryFee)}</strong></div>
          <div className="checkout-total"><span>Total</span><strong>{formatBRL(total)}</strong></div>

          <button className="button button-large button-full" disabled={saving}>
            {saving ? "Processando..." : "Enviar pedido pelo WhatsApp"}
          </button>
        </section>
      </form>
    </main>
  );
}
