import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  MessageCircle,
  QrCode,
  Smartphone,
  Sparkles,
  Store
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    name: "Starter",
    description: "Para quem está começando a vender pelo cardápio digital.",
    monthly: 29.9,
    yearly: 299,
    featured: false,
    badge: null,
    features: [
      "Até 50 produtos",
      "Categorias do cardápio",
      "Pedidos pelo WhatsApp",
      "QR Code do estabelecimento",
      "App instalável (PWA)"
    ]
  },
  {
    name: "Pro",
    description: "Para negócios que recebem pedidos todos os dias.",
    monthly: 49.9,
    yearly: 499,
    featured: true,
    badge: "Mais escolhido",
    features: [
      "Produtos ilimitados",
      "Pedidos em tempo real",
      "Personalização de cores",
      "Logo e imagem de capa",
      "QR Code em PNG e SVG",
      "App instalável (PWA)"
    ]
  },
  {
    name: "Premium",
    description: "Para operações que querem mais estrutura e crescimento.",
    monthly: 79.9,
    yearly: 799,
    featured: false,
    badge: "Para crescer",
    features: [
      "Tudo do plano Pro",
      "Recursos avançados do negócio",
      "Mais opções de gerenciamento",
      "Prioridade em novos recursos",
      "Suporte prioritário"
    ]
  }
] as const;

function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function whatsappPlanUrl(
  planName: string,
  billingCycle: BillingCycle,
  price: number
) {
  const rawNumber = (import.meta.env.VITE_SALES_WHATSAPP as string | undefined) || "";
  const number = rawNumber.replace(/\D/g, "");

  const period = billingCycle === "monthly" ? "Mensal" : "Anual";
  const message = [
    "Olá! 👋",
    "",
    "Quero contratar um plano do Menufy.",
    "",
    `📦 Plano: ${planName}`,
    `🗓️ Período: ${period}`,
    `💰 Valor: R$ ${brl(price)}${billingCycle === "monthly" ? "/mês" : "/ano"}`,
    "",
    "Pode me ajudar a ativar meu cardápio?"
  ].join("\n");

  if (!number) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="landing">
      <header className="site-header container">
        <Logo />
        <nav>
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
          <Link className="button button-outline" to="/login">Entrar</Link>
        </nav>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">🍔 Cardápio digital profissional</span>
            <h1>Transforme seu cardápio em uma experiência de vendas.</h1>
            <p>
              Receba pedidos organizados pelo WhatsApp, atualize produtos em segundos
              e compartilhe seu menu por link ou QR Code.
            </p>
            <div className="hero-actions">
              <Link className="button button-large" to="/login">
                Criar meu cardápio <ArrowRight size={19} />
              </Link>
            </div>
            <div className="hero-checks">
              <span><Check size={17} /> Sem app obrigatório</span>
              <span><Check size={17} /> Funciona no celular</span>
              <span><Check size={17} /> Pedido pelo WhatsApp</span>
            </div>
          </div>

          <div className="phone-preview">
            <div className="phone-top"></div>
            <div className="phone-screen">
              <div className="mock-cover"></div>
              <h3>Seu estabelecimento</h3>
              <p>Cardápio online • Entrega e retirada</p>
              <div className="mock-search">Buscar no cardápio...</div>
              <div className="mock-product">
                <div>
                  <strong>Produto destaque</strong>
                  <small>Descrição do seu produto</small>
                  <b>R$ 29,90</b>
                </div>
                <div className="mock-image">🍔</div>
              </div>
              <div className="mock-product">
                <div>
                  <strong>Combo especial</strong>
                  <small>Monte sua oferta no painel</small>
                  <b>R$ 39,90</b>
                </div>
                <div className="mock-image">🍟</div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="section container">
          <div className="section-heading">
            <span className="eyebrow">Tudo em um só lugar</span>
            <h2>Feito para vender mais e dar menos trabalho</h2>
          </div>
          <div className="feature-grid">
            {[
              [Smartphone, "Cardápio mobile", "Seu cliente acessa no navegador e também pode instalar como app."],
              [MessageCircle, "Pedidos no WhatsApp", "O pedido chega montado e organizado."],
              [QrCode, "QR Code", "Use em mesas, balcão, embalagens e redes sociais."],
              [Store, "Painel do negócio", "Cadastre produtos, preços, categorias e aparência."]
            ].map(([Icon, title, text]: any) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="section pricing-section">
          <div className="container">
            <div className="pricing-heading">
              <div className="section-heading pricing-copy">
                <span className="eyebrow">Planos simples</span>
                <h2>Escolha o plano que combina com seu momento</h2>
                <p>
                  Sem taxa por pedido. Comece com o essencial e evolua conforme seu negócio crescer.
                </p>
              </div>

              <div className="billing-toggle" aria-label="Período da assinatura">
                <button
                  type="button"
                  className={billingCycle === "monthly" ? "active" : ""}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  className={billingCycle === "yearly" ? "active" : ""}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Anual
                  <span>2 meses grátis</span>
                </button>
              </div>
            </div>

            <div className="pricing-grid pricing-grid-modern">
              {plans.map((plan) => {
                const price = billingCycle === "monthly" ? plan.monthly : plan.yearly;
                const yearlyMonthlyEquivalent = plan.yearly / 12;

                return (
                  <article
                    className={`price-card price-card-modern ${plan.featured ? "featured" : ""}`}
                    key={plan.name}
                  >
                    <div className="price-card-top">
                      <div>
                        <span className="plan-name">{plan.name}</span>
                        {plan.badge && (
                          <span className={plan.featured ? "price-badge-modern featured" : "price-badge-modern"}>
                            {plan.featured && <Sparkles size={13} />}
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p>{plan.description}</p>
                    </div>

                    <div className="price-value">
                      <span>R$</span>
                      <strong>{brl(price)}</strong>
                      <small>{billingCycle === "monthly" ? "/mês" : "/ano"}</small>
                    </div>

                    {billingCycle === "yearly" ? (
                      <p className="price-equivalent">
                        Equivale a R$ {brl(yearlyMonthlyEquivalent)}/mês
                      </p>
                    ) : (
                      <p className="price-equivalent">Cobrança mensal</p>
                    )}

                    <a
                      className={plan.featured ? "button button-large plan-cta whatsapp-plan-cta" : "button button-outline button-large plan-cta whatsapp-plan-cta"}
                      href={whatsappPlanUrl(plan.name, billingCycle, price)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={18} />
                      Contratar pelo WhatsApp
                    </a>

                    <div className="plan-divider"></div>

                    <strong className="plan-includes">O que está incluído:</strong>

                    <ul className="plan-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <CheckCircle2 size={18} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="pricing-footnote">
              <span><Check size={16} /> Sem taxa por pedido</span>
              <span><Check size={16} /> Cancele quando quiser</span>
              <span><Check size={16} /> Funciona em celular e computador</span>
            </div>

            <p className="pricing-whatsapp-note">
              Ao clicar em contratar, uma conversa será aberta no WhatsApp com o plano escolhido.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="site-footer-brand">
            <Logo />
            <p>Seu cardápio. Seus pedidos. Seu negócio online.</p>
          </div>

          <div className="site-footer-links">
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
            <Link to="/login">Entrar</Link>
          </div>

          <div className="developer-contact">
            <span>Desenvolvimento e suporte</span>
            <a href="mailto:rojonas71@gmail.com">
              <Mail size={16} />
              rojonas71@gmail.com
            </a>
          </div>
        </div>

        <div className="container site-footer-bottom">
          <span>© {new Date().getFullYear()} Menufy</span>
          <span>Desenvolvido por Jonash.dev</span>
        </div>
      </footer>
    </div>
  );
}
