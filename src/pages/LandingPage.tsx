import { ArrowRight, Check, MessageCircle, QrCode, Smartphone, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="site-header container">
        <Logo />
        <nav>
          <a href="#recursos">Recursos</a>
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

              <div className="mock-search">
                Buscar no cardápio...
              </div>

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
              [
                Smartphone,
                "Cardápio mobile",
                "Seu cliente acessa no navegador e também pode instalar como app."
              ],
              [
                MessageCircle,
                "Pedidos no WhatsApp",
                "O pedido chega montado e organizado."
              ],
              [
                QrCode,
                "QR Code",
                "Use em mesas, balcão, embalagens e redes sociais."
              ],
              [
                Store,
                "Painel do negócio",
                "Cadastre produtos, preços, categorias e aparência."
              ]
            ].map(([Icon, title, text]: any) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={24} />
                </span>

                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="container landing-final-cta-inner">
            <div>
              <span className="eyebrow">Seu negócio online</span>
              <h2>Seu cardápio pronto para receber pedidos.</h2>
              <p>
                Organize produtos, compartilhe seu link e receba pedidos diretamente
                pelo WhatsApp.
              </p>
            </div>

            <Link className="button button-large" to="/login">
              Começar agora <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
