import {
  ArrowLeft,
  Banknote,
  Bike,
  Check,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  UtensilsCrossed
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
        const nextBusiness = data as Business;
        setBusiness(nextBusiness);

        if (nextBusiness.delivery_enabled !== false) {
          setForm((current) => ({ ...current, order_type: "delivery" }));
        } else if (nextBusiness.pickup_enabled !== false) {
          setForm((current) => ({ ...current, order_type: "pickup" }));
        } else {
          setForm((current) => ({ ...current, order_type: "local" }));
        }
      }

      setLoadingBusiness(false);
    };

    loadBusiness();
  }, [slug]);

  const deliveryFee =
    form.order_type === "delivery" ? Number(business?.delivery_fee || 0) : 0;
  const minimumOrder = Number(business?.minimum_order || 0);
  const total = subtotal + deliveryFee;
  const minimumRemaining = Math.max(0, minimumOrder - subtotal);
  const canOrder = business?.is_open !== false && minimumRemaining <= 0;

  const orderTypeOptions = useMemo(
    () =>
      [
        business?.delivery_enabled !== false && {
          value: "delivery",
          label: "Entrega",
          description:
            deliveryFee > 0 ? `Taxa ${formatBRL(deliveryFee)}` : "Entrega grátis",
          icon: Bike
        },
        business?.pickup_enabled !== false && {
          value: "pickup",
          label: "Retirada",
          description: "Retire no estabelecimento",
          icon: Store
        },
        business?.dine_in_enabled !== false && {
          value: "local",
          label: "No local",
          description: "Consumir no estabelecimento",
          icon: UtensilsCrossed
        }
      ].filter(Boolean) as Array<{
        value: "delivery" | "pickup" | "local";
        label: string;
        description: string;
        icon: typeof Bike;
      }>,
    [business, deliveryFee]
  );

  const update = (field: keyof CheckoutData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length || !business || !supabase || !canOrder) return;

    if (items.some((item) => item.product.is_sold_out)) {
      setErrorMessage("Um dos produtos do carrinho está esgotado. Volte ao cardápio e atualize seu pedido.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          business_id: business.id,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          order_type: form.order_type,
          payment_method: form.payment_method,
          delivery_address: form.order_type === "delivery" ? form.address?.trim() : null,
          notes: form.notes?.trim() || null,
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

      const paymentLabel =
        form.payment_method === "pix"
          ? "PIX"
          : form.payment_method === "cash"
            ? "Dinheiro"
            : "Cartão";

      const typeLabel =
        form.order_type === "delivery"
          ? "Entrega"
          : form.order_type === "pickup"
            ? "Retirada"
            : "Consumir no local";

      const lines = [
        `🍽️ *NOVO PEDIDO - ${business.name}*`,
        `🧾 Pedido #${orderData.order_number}`,
        "",
        `👤 *Cliente:* ${form.customer_name}`,
        `📱 *Telefone:* ${form.customer_phone}`,
        "",
        "━━━━━━━━━━━━━━━━",
        "*ITENS DO PEDIDO*",
        ...items.flatMap((item) => [
          `${item.quantity}x *${item.product.name}*`,
          `   ${formatBRL((item.product.promotional_price ?? item.product.price) * item.quantity)}`
        ]),
        "━━━━━━━━━━━━━━━━",
        `Subtotal: ${formatBRL(subtotal)}`,
        form.order_type === "delivery"
          ? `Taxa de entrega: ${deliveryFee > 0 ? formatBRL(deliveryFee) : "Grátis"}`
          : "",
        `💰 *TOTAL: ${formatBRL(total)}*`,
        "",
        `💳 *Pagamento:* ${paymentLabel}`,
        `📦 *Tipo:* ${typeLabel}`,
        form.order_type === "delivery" ? `📍 *Endereço:* ${form.address}` : "",
        form.notes ? `📝 *Observação:* ${form.notes}` : "",
        "",
        "Pedido realizado pelo Menufy."
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
      <main className="checkout-page checkout-page-pro container narrow">
        <Link className="back-link" to={`/menu/${slug}`}><ArrowLeft size={18} /> Voltar</Link>
        <div className="empty-state checkout-empty">
          <ShoppingBag size={34} />
          <h2>Seu carrinho está vazio</h2>
          <p>Escolha seus produtos favoritos para continuar.</p>
          <Link className="button" to={`/menu/${slug}`}>Ver cardápio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-page-pro container">
      <header className="checkout-pro-header">
        <Link className="back-link" to={`/menu/${slug}`}>
          <ArrowLeft size={18} /> Voltar ao cardápio
        </Link>

        <div>
          <span className="eyebrow">Seu pedido</span>
          <h1>Finalizar pedido</h1>
          <p>{business.name}</p>
        </div>
      </header>

      <form onSubmit={submit} className="checkout-pro-layout">
        <div className="checkout-pro-main">
          <section className="checkout-section checkout-products-card">
            <div className="checkout-pro-section-title">
              <span>1</span>
              <div>
                <h2>Revise seu pedido</h2>
                <p>Confira quantidades antes de continuar.</p>
              </div>
            </div>

            <div className="checkout-items-pro">
              {items.map((item) => (
                <div className="checkout-item checkout-item-pro" key={item.product.id}>
                  <div className="checkout-item-product">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt="" />
                    ) : (
                      <span>🍽️</span>
                    )}

                    <div>
                      <strong>{item.product.name}</strong>
                      <small>
                        {formatBRL(item.product.promotional_price ?? item.product.price)} cada
                      </small>
                      <b>
                        {formatBRL(
                          (item.product.promotional_price ?? item.product.price) * item.quantity
                        )}
                      </b>
                    </div>
                  </div>

                  <div className="qty-control checkout-qty-pro">
                    <button type="button" onClick={() => decreaseItem(item.product.id)}>
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => addItem(item.product)}>
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeItem(item.product.id)}
                      aria-label={`Remover ${item.product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-pro-section-title">
              <span>2</span>
              <div>
                <h2>Como você quer receber?</h2>
                <p>Escolha uma das opções disponíveis.</p>
              </div>
            </div>

            <div className="checkout-order-type-grid">
              {orderTypeOptions.map(({ value, label, description, icon: Icon }) => (
                <label
                  key={value}
                  className={`checkout-order-type-card ${form.order_type === value ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="order_type"
                    value={value}
                    checked={form.order_type === value}
                    onChange={() => update("order_type", value)}
                  />
                  <Icon size={21} />
                  <div>
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </div>
                  {form.order_type === value && <Check size={17} />}
                </label>
              ))}
            </div>

            {form.order_type === "delivery" && (
              <label className="checkout-field-pro">
                <span>
                  <MapPin size={15} />
                  Endereço de entrega
                </span>
                <input
                  required
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Rua, número, bairro e complemento"
                />
              </label>
            )}
          </section>

          <section className="checkout-section">
            <div className="checkout-pro-section-title">
              <span>3</span>
              <div>
                <h2>Seus dados</h2>
                <p>Precisamos dessas informações para identificar o pedido.</p>
              </div>
            </div>

            <div className="form-grid checkout-form-pro">
              <label>
                Nome
                <input
                  required
                  value={form.customer_name}
                  onChange={(event) => update("customer_name", event.target.value)}
                  placeholder="Seu nome"
                />
              </label>

              <label>
                WhatsApp
                <input
                  required
                  inputMode="tel"
                  value={form.customer_phone}
                  onChange={(event) => update("customer_phone", event.target.value)}
                  placeholder="(17) 99999-9999"
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-pro-section-title">
              <span>4</span>
              <div>
                <h2>Forma de pagamento</h2>
                <p>Selecione como deseja pagar.</p>
              </div>
            </div>

            <div className="checkout-payment-grid">
              {[
                { value: "pix", label: "PIX", icon: Banknote },
                { value: "cash", label: "Dinheiro", icon: Banknote },
                { value: "card", label: "Cartão", icon: CreditCard }
              ].map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={`checkout-payment-card ${form.payment_method === value ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={value}
                    checked={form.payment_method === value}
                    onChange={() => update("payment_method", value)}
                  />
                  <Icon size={20} />
                  <span>{label}</span>
                  {form.payment_method === value && <Check size={16} />}
                </label>
              ))}
            </div>

            <label className="checkout-field-pro checkout-notes-pro">
              Observações do pedido
              <textarea
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Ex.: tirar cebola, ponto da carne, referência para entrega..."
              />
            </label>
          </section>

          {errorMessage && <div className="form-message">{errorMessage}</div>}
        </div>

        <aside className="checkout-summary checkout-summary-pro">
          <div className="checkout-summary-heading">
            <ShoppingBag size={19} />
            <div>
              <strong>Resumo</strong>
              <span>{items.length} {items.length === 1 ? "produto" : "produtos"}</span>
            </div>
          </div>

          <div className="checkout-summary-lines">
            <div><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
            <div>
              <span>Entrega</span>
              <strong>
                {form.order_type !== "delivery"
                  ? "—"
                  : deliveryFee > 0
                    ? formatBRL(deliveryFee)
                    : "Grátis"}
              </strong>
            </div>
          </div>

          <div className="checkout-total checkout-total-pro">
            <span>Total</span>
            <strong>{formatBRL(total)}</strong>
          </div>

          {minimumRemaining > 0 && (
            <div className="checkout-minimum-alert">
              Faltam <strong>{formatBRL(minimumRemaining)}</strong> para atingir o pedido mínimo.
              <Link to={`/menu/${slug}`}>Adicionar mais itens</Link>
            </div>
          )}

          {business.is_open === false && (
            <div className="checkout-minimum-alert closed">
              O estabelecimento está fechado e não está recebendo novos pedidos agora.
            </div>
          )}

          <button
            className="button button-large button-full checkout-whatsapp-button"
            disabled={saving || !canOrder}
          >
            {saving ? "Processando..." : "Enviar pedido pelo WhatsApp"}
          </button>

          <small className="checkout-security-note">
            Ao continuar, seu pedido será registrado e você será direcionado ao WhatsApp do estabelecimento.
          </small>
        </aside>
      </form>
    </main>
  );
}
