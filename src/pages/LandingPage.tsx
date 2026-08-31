import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  MessageCircle,
  Package,
  Palette,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wifi,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Smartphone,
    title: "Cardápio responsivo",
    description:
      "Uma experiência rápida e organizada em celular, tablet e computador."
  },
  {
    icon: MessageCircle,
    title: "Pedidos pelo WhatsApp",
    description:
      "O cliente monta o pedido e envia tudo organizado para o WhatsApp do estabelecimento."
  },
  {
    icon: QrCode,
    title: "QR Code pronto",
    description:
      "Compartilhe em mesas, balcão, embalagens, panfletos e redes sociais."
  },
  {
    icon: Package,
    title: "Produtos e categorias",
    description:
      "Cadastre itens, preços, descrições e organize todo o cardápio pelo painel."
  },
  {
    icon: Palette,
    title: "Identidade visual",
    description:
      "Personalize cores, logo e capa para deixar o cardápio com a cara do negócio."
  },
  {
    icon: ShoppingBag,
    title: "Gestão de pedidos",
    description:
      "Acompanhe pedidos e atualize o status da operação em tempo real."
  },
  {
    icon: BarChart3,
    title: "Visão do negócio",
    description:
      "Tenha indicadores rápidos para acompanhar volume de pedidos e operação."
  },
  {
    icon: Wifi,
    title: "PWA instalável",
    description:
      "O sistema pode ser instalado no celular como aplicativo, sem depender de loja."
  }
];

const steps = [
  {
    number: "01",
    title: "Crie seu estabelecimento",
    description:
      "Cadastre os dados principais do negócio e deixe sua página pronta para personalização."
  },
  {
    number: "02",
    title: "Monte seu cardápio",
    description:
      "Organize categorias, adicione produtos, preços, descrições e imagens."
  },
  {
    number: "03",
    title: "Compartilhe o link",
    description:
      "Divulgue pelo WhatsApp, Instagram, Google ou através do QR Code."
  },
  {
    number: "04",
    title: "Receba e acompanhe pedidos",
    description:
      "Seu cliente escolhe os itens e você acompanha a operação pelo painel."
  }
];

const businessTypes = [
  "Hamburguerias",
  "Pizzarias",
  "Restaurantes",
  "Lanchonetes",
  "Açaíterias",
  "Cafeterias",
  "Marmitarias",
  "Docerias",
  "Pastelarias",
  "Food trucks"
];

const faqs = [
  {
    question: "Preciso instalar algum aplicativo?",
    answer:
      "Não. O cardápio funciona direto no navegador. O estabelecimento também pode instalar o Menufy como PWA no celular."
  },
  {
    question: "O cliente precisa criar uma conta?",
    answer:
      "Não. O cliente acessa o link público do cardápio, escolhe os produtos e segue o fluxo de pedido."
  },
  {
    question: "Posso alterar produtos e preços depois?",
    answer:
      "Sim. O painel permite gerenciar categorias, produtos, preços, disponibilidade e aparência sempre que necessário."
  },
  {
    question: "Como o cliente acessa o cardápio?",
    answer:
      "Por link direto ou QR Code. Você pode colocar o acesso no Instagram, WhatsApp, mesas, balcão e materiais impressos."
  },
  {
    question: "Funciona no celular e no computador?",
    answer:
      "Sim. A interface foi preparada para funcionar de forma responsiva em diferentes tamanhos de tela."
  },
  {
    question: "O Menufy cobra comissão por pedido?",
    answer:
      "O sistema foi pensado para o estabelecimento manter o próprio canal de atendimento, sem depender de marketplace para receber o pedido pelo WhatsApp."
  }
];

export function LandingPage() {
  return (
    <div className="landing landing-premium">
      <header className="site-header landing-header container">
        <Logo />

        <nav className="landing-nav">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="landing-header-actions">
          <Link className="landing-login-link" to="/login">
            Entrar
          </Link>
          <Link className="button" to="/login">
            Criar cardápio
          </Link>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="container premium-hero-grid">
            <div className="premium-hero-copy">
              <span className="premium-badge">
                <Sparkles size={15} />
                Cardápio digital completo para o seu negócio
              </span>

              <h1>
                Seu cardápio online,
                <span> profissional e pronto para vender.</span>
              </h1>

              <p>
                Organize produtos, compartilhe por link ou QR Code, receba pedidos
                pelo WhatsApp e administre tudo em um painel simples, rápido e
                responsivo.
              </p>

              <div className="hero-actions premium-hero-actions">
                <Link className="button button-large" to="/login">
                  Criar meu cardápio
                  <ArrowRight size={19} />
                </Link>

                <a className="premium-secondary-action" href="#como-funciona">
                  Ver como funciona
                  <ChevronRight size={18} />
                </a>
              </div>

              <div className="premium-hero-checks">
                <span>
                  <Check size={16} />
                  Sem app obrigatório
                </span>
                <span>
                  <Check size={16} />
                  Link e QR Code
                </span>
                <span>
                  <Check size={16} />
                  Painel administrativo
                </span>
              </div>

              <div className="premium-trust-note">
                <ShieldCheck size={19} />
                <div>
                  <strong>Seu canal direto com o cliente</strong>
                  <span>
                    Controle seu cardápio e mantenha o atendimento no WhatsApp do
                    próprio estabelecimento.
                  </span>
                </div>
              </div>
            </div>

            <div className="premium-product-showcase">
              <div className="premium-showcase-glow" />

              <div className="premium-dashboard-card">
                <div className="premium-dashboard-top">
                  <div>
                    <span className="premium-window-dot" />
                    <span className="premium-window-dot" />
                    <span className="premium-window-dot" />
                  </div>
                  <small>Painel Menufy</small>
                </div>

                <div className="premium-dashboard-body">
                  <aside>
                    <div className="premium-mini-logo">M</div>
                    <span className="active"><LayoutDashboard size={16} /></span>
                    <span><ShoppingBag size={16} /></span>
                    <span><Package size={16} /></span>
                    <span><Palette size={16} /></span>
                    <span><QrCode size={16} /></span>
                  </aside>

                  <div className="premium-dashboard-content">
                    <div className="premium-dashboard-heading">
                      <div>
                        <small>Visão geral</small>
                        <strong>Seu estabelecimento</strong>
                      </div>
                      <span className="premium-live-pill">
                        <span />
                        Online
                      </span>
                    </div>

                    <div className="premium-stat-row">
                      <article>
                        <span>Pedidos</span>
                        <strong>12</strong>
                        <small>Hoje</small>
                      </article>
                      <article>
                        <span>Produtos</span>
                        <strong>48</strong>
                        <small>Ativos</small>
                      </article>
                      <article>
                        <span>Operação</span>
                        <strong>Online</strong>
                        <small>Recebendo pedidos</small>
                      </article>
                    </div>

                    <div className="premium-order-preview">
                      <div className="premium-order-head">
                        <div>
                          <ShoppingBag size={17} />
                          <strong>Pedidos recentes</strong>
                        </div>
                        <span>Tempo real</span>
                      </div>

                      <div className="premium-order-row">
                        <div>
                          <strong>#1024</strong>
                          <small>Cliente • WhatsApp</small>
                        </div>
                        <span className="premium-status preparing">Preparando</span>
                        <b>R$ 42,90</b>
                      </div>

                      <div className="premium-order-row">
                        <div>
                          <strong>#1023</strong>
                          <small>Cliente • Retirada</small>
                        </div>
                        <span className="premium-status confirmed">Confirmado</span>
                        <b>R$ 31,50</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-phone-card">
                <div className="premium-phone-notch" />
                <div className="premium-phone-cover">
                  <span>Seu logo</span>
                </div>
                <div className="premium-phone-content">
                  <div>
                    <strong>Seu estabelecimento</strong>
                    <small>Aberto • Entrega e retirada</small>
                  </div>

                  <div className="premium-search-bar">Buscar no cardápio...</div>

                  <article className="premium-menu-item">
                    <div>
                      <strong>Produto destaque</strong>
                      <small>Descrição curta e atrativa do produto</small>
                      <b>R$ 29,90</b>
                    </div>
                    <span>🍔</span>
                  </article>

                  <article className="premium-menu-item">
                    <div>
                      <strong>Combo especial</strong>
                      <small>Oferta preparada pelo estabelecimento</small>
                      <b>R$ 39,90</b>
                    </div>
                    <span>🍟</span>
                  </article>

                  <button type="button">
                    Ver pedido
                    <span>2 itens</span>
                  </button>
                </div>
              </div>

              <div className="premium-floating-card qr">
                <QrCode size={20} />
                <div>
                  <strong>QR Code</strong>
                  <span>Compartilhe em qualquer lugar</span>
                </div>
              </div>

              <div className="premium-floating-card realtime">
                <Zap size={20} />
                <div>
                  <strong>Tempo real</strong>
                  <span>Operação sempre atualizada</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="business-types-strip">
          <div className="container">
            <p>Feito para negócios de alimentação</p>
            <div className="business-types-list">
              {businessTypes.map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="premium-section container">
          <div className="premium-section-heading">
            <span className="premium-badge small">
              <LayoutDashboard size={14} />
              Recursos
            </span>
            <h2>Tudo o que você precisa para colocar seu cardápio online.</h2>
            <p>
              Uma estrutura centralizada para cuidar do cardápio, da aparência e
              dos pedidos sem complicação.
            </p>
          </div>

          <div className="premium-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="premium-feature-card" key={title}>
                <span className="premium-feature-icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="premium-how-section">
          <div className="container">
            <div className="premium-section-heading centered">
              <span className="premium-badge small">
                <Clock3 size={14} />
                Como funciona
              </span>
              <h2>Do cadastro ao primeiro pedido em poucos passos.</h2>
              <p>
                O Menufy foi pensado para ser simples para quem administra e fácil
                para quem compra.
              </p>
            </div>

            <div className="premium-steps">
              {steps.map((step) => (
                <article key={step.number}>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-control-section container">
          <div className="premium-control-copy">
            <span className="premium-badge small">
              <Store size={14} />
              Controle do negócio
            </span>

            <h2>Atualize o cardápio quando quiser, sem depender de terceiros.</h2>

            <p>
              Faça alterações no painel e mantenha sua operação atualizada para o
              cliente. Produtos, preços, categorias, cores, logo, capa e muito mais.
            </p>

            <ul>
              <li><Check size={16} /> Ative ou desative produtos rapidamente.</li>
              <li><Check size={16} /> Organize o cardápio por categorias.</li>
              <li><Check size={16} /> Personalize cores, logo e capa.</li>
              <li><Check size={16} /> Gere e baixe seu QR Code.</li>
              <li><Check size={16} /> Acompanhe pedidos pelo painel.</li>
            </ul>

            <Link className="button button-large" to="/login">
              Acessar o Menufy
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="premium-control-visual">
            <div className="control-visual-window">
              <div className="control-visual-header">
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <small>Aparência</small>
              </div>

              <div className="control-visual-body">
                <div className="control-settings-column">
                  <div>
                    <small>Cor principal</small>
                    <span className="color-control">
                      <i />
                      #FF6B00
                    </span>
                  </div>

                  <div>
                    <small>Logo</small>
                    <span className="fake-input">logo-do-negocio.png</span>
                  </div>

                  <div>
                    <small>Capa</small>
                    <span className="fake-input">capa-cardapio.jpg</span>
                  </div>

                  <div>
                    <small>Status</small>
                    <span className="online-setting">
                      <i />
                      Cardápio online
                    </span>
                  </div>
                </div>

                <div className="control-preview-column">
                  <span className="control-preview-label">Prévia</span>
                  <div className="control-preview-phone">
                    <div className="control-preview-cover" />
                    <strong>Seu estabelecimento</strong>
                    <small>Cardápio personalizado</small>
                    <div className="control-preview-item">
                      <span />
                      <div>
                        <b>Produto</b>
                        <small>R$ 29,90</small>
                      </div>
                    </div>
                    <div className="control-preview-item">
                      <span />
                      <div>
                        <b>Produto</b>
                        <small>R$ 34,90</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="para-quem" className="premium-audience-section">
          <div className="container premium-audience-grid">
            <div className="premium-audience-copy">
              <span className="premium-badge small">
                <UtensilsCrossed size={14} />
                Para quem é
              </span>
              <h2>Um cardápio digital que acompanha diferentes tipos de negócio.</h2>
              <p>
                Seja para atendimento no balcão, retirada, delivery próprio ou mesas,
                o Menufy ajuda a apresentar seus produtos de forma organizada.
              </p>
            </div>

            <div className="premium-audience-cards">
              <article>
                <Store size={22} />
                <div>
                  <strong>Negócios locais</strong>
                  <span>Tenha um link profissional para divulgar sua marca.</span>
                </div>
              </article>

              <article>
                <QrCode size={22} />
                <div>
                  <strong>Atendimento presencial</strong>
                  <span>Use QR Code em mesas, balcões e embalagens.</span>
                </div>
              </article>

              <article>
                <MessageCircle size={22} />
                <div>
                  <strong>Delivery próprio</strong>
                  <span>Direcione o pedido para o WhatsApp do estabelecimento.</span>
                </div>
              </article>

              <article>
                <Smartphone size={22} />
                <div>
                  <strong>Operação mobile</strong>
                  <span>Gerencie o negócio também pelo celular.</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="premium-faq-section container">
          <div className="premium-section-heading centered">
            <span className="premium-badge small">
              <MessageCircle size={14} />
              Dúvidas frequentes
            </span>
            <h2>Antes de começar, veja as principais respostas.</h2>
          </div>

          <div className="premium-faq-grid">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <span>+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="premium-final-cta">
          <div className="container premium-final-cta-card">
            <div className="premium-final-cta-copy">
              <span className="premium-badge dark">
                <Sparkles size={14} />
                Comece seu cardápio digital
              </span>
              <h2>Seu negócio merece um cardápio tão profissional quanto seus produtos.</h2>
              <p>
                Crie seu estabelecimento, organize seus produtos e compartilhe seu
                cardápio com seus clientes.
              </p>
            </div>

            <div className="premium-final-cta-actions">
              <Link className="button button-large" to="/login">
                Criar meu cardápio
                <ArrowRight size={19} />
              </Link>
              <span>
                <Check size={15} />
                Configuração simples
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="premium-footer">
        <div className="container premium-footer-inner">
          <div>
            <Logo />
            <p>Seu cardápio. Seus pedidos. Seu negócio online.</p>
          </div>

          <div className="premium-footer-links">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#faq">FAQ</a>
            <Link to="/login">Entrar</Link>
          </div>

          <small>Menufy • Cardápio digital</small>
        </div>
      </footer>
    </div>
  );
}
