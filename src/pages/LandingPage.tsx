import { ArrowRight, Check, QrCode, Smartphone, Store, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export function LandingPage() {
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
              <span><Check size={17} /> Sem app para instalar</span>
              <span><Check size={17} /> Funciona no celular</span>
              <span><Check size={17} /> Pedido pelo WhatsApp</span>
            </div>
          </div>

          <div className="phone-preview">
            <div className="phone-top"></div>
            <div className="phone-screen">
              <div className="mock-cover"></div>
              <h3>Burger House</h3>
              <p>Aberto agora • Entrega e retirada</p>
              <div className="mock-search">Buscar no cardápio...</div>
              <div className="mock-product">
                <div>
                  <strong>X-Bacon Artesanal</strong>
                  <small>Pão brioche, burger, queijo e bacon</small>
                  <b>R$ 29,90</b>
                </div>
                <div className="mock-image">🍔</div>
              </div>
              <div className="mock-product">
                <div>
                  <strong>Combo Individual</strong>
                  <small>Burger + batata + refrigerante</small>
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
              [Smartphone, "Cardápio mobile", "Seu cliente acessa sem instalar nada."],
              [MessageCircle, "Pedidos no WhatsApp", "O pedido chega montado e organizado."],
              [QrCode, "QR Code", "Use em mesas, balcão, embalagens e redes sociais."],
              [Store, "Painel do negócio", "Cadastre produtos, preços e categorias."]
            ].map(([Icon, title, text]: any) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="section container">
          <div className="section-heading">
            <span className="eyebrow">Planos simples</span>
            <h2>Comece pequeno e cresça com seus clientes</h2>
          </div>
          <div className="pricing-grid">
            <article className="price-card">
              <h3>Starter</h3>
              <strong>R$ 29,90 <small>/mês</small></strong>
              <p>Para pequenos estabelecimentos.</p>
              <ul>
                <li>Até 50 produtos</li>
                <li>QR Code</li>
                <li>WhatsApp</li>
                <li>Categorias</li>
              </ul>
            </article>
            <article className="price-card featured">
              <span className="price-badge">Mais popular</span>
              <h3>Pro</h3>
              <strong>R$ 49,90 <small>/mês</small></strong>
              <p>Para quem quer vender todos os dias.</p>
              <ul>
                <li>Produtos ilimitados</li>
                <li>Cupons</li>
                <li>Relatórios</li>
                <li>Personalização</li>
              </ul>
            </article>
            <article className="price-card">
              <h3>Premium</h3>
              <strong>R$ 79,90 <small>/mês</small></strong>
              <p>Para operações em crescimento.</p>
              <ul>
                <li>Múltiplos usuários</li>
                <li>Domínio próprio</li>
                <li>Relatórios avançados</li>
                <li>Suporte prioritário</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
