import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type Mode = "login" | "signup";

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function passwordLabel(score: number) {
  if (score <= 1) return "Muito fraca";
  if (score === 2) return "Fraca";
  if (score === 3) return "Boa";
  if (score === 4) return "Forte";
  return "Muito forte";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const score = useMemo(() => passwordScore(password), [password]);

  useEffect(() => {
    const saved = localStorage.getItem("menufy_login_email");
    if (saved) setEmail(saved);

    const params = new URLSearchParams(location.search);
    if (params.get("confirmed") === "1") {
      setMessage("Email confirmado com sucesso. Agora você já pode entrar.");
      setMessageType("success");
    }

    if (params.get("registered") === "1") {
      setMessage("Conta criada. Confira seu email para confirmar o cadastro.");
      setMessageType("success");
    }

    if (params.get("reset") === "1") {
      setMessage("Senha alterada com sucesso. Entre com sua nova senha.");
      setMessageType("success");
    }
  }, [location.search]);

  useEffect(() => {
    const client = supabase;

    if (!client || !isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    const check = async () => {
      const { data } = await client.auth.getUser();

      if (data.user) {
        const { data: membership } = await client
          .from("business_members")
          .select("business_id")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();

        const { data: ownedBusiness } = await client
          .from("businesses")
          .select("id")
          .eq("owner_id", data.user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.business_id || ownedBusiness?.id) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }

      setCheckingSession(false);
    };

    check();
  }, [navigate]);

  const validateSignup = () => {
    if (!fullName.trim()) {
      setMessage("Informe seu nome.");
      setMessageType("error");
      return false;
    }

    if (password.length < 8) {
      setMessage("Sua senha precisa ter pelo menos 8 caracteres.");
      setMessageType("error");
      return false;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setMessage("Use pelo menos uma letra maiúscula, uma minúscula e um número.");
      setMessageType("error");
      return false;
    }

    if (password !== passwordConfirm) {
      setMessage("As senhas não coincidem.");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const client = supabase;

    if (!client || !isSupabaseConfigured) {
      setMessage("Supabase não está configurado.");
      setMessageType("error");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Informe seu email.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return;
    }

    if (mode === "signup" && !validateSignup()) return;

    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { data, error } = await client.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (error) {
          const raw = error.message.toLowerCase();

          if (raw.includes("invalid login credentials")) {
            throw new Error("Email ou senha incorretos.");
          }

          if (raw.includes("email not confirmed")) {
            throw new Error("Confirme seu email antes de entrar.");
          }

          throw error;
        }

        if (rememberEmail) {
          localStorage.setItem("menufy_login_email", normalizedEmail);
        } else {
          localStorage.removeItem("menufy_login_email");
        }

        const userId = data.user?.id;

        if (!userId) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const [{ data: membership }, { data: ownedBusiness }] = await Promise.all([
          client
            .from("business_members")
            .select("business_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle(),
          client
            .from("businesses")
            .select("id")
            .eq("owner_id", userId)
            .limit(1)
            .maybeSingle()
        ]);

        if (membership?.business_id || ownedBusiness?.id) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }

        return;
      }

      const emailRedirectTo = `${window.location.origin}/login?confirmed=1`;

      const { data, error } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        const raw = error.message.toLowerCase();

        if (raw.includes("already registered") || raw.includes("user already registered")) {
          throw new Error("Este email já possui uma conta. Tente entrar.");
        }

        throw error;
      }

      if (data.session) {
        navigate("/onboarding", { replace: true });
        return;
      }

      setMode("login");
      setPassword("");
      setPasswordConfirm("");
      setMessage("Conta criada. Enviamos um email para você confirmar o cadastro.");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível continuar.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="auth-loading-page">
        <div className="auth-loading-card">
          <div className="auth-loading-logo">
            <Store size={25} />
          </div>
          <strong>Menufy</strong>
          <span>Verificando sua sessão...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-pro-page">
      <section className="auth-pro-brand-panel">
        <div className="auth-pro-brand-top">
          <Link to="/" aria-label="Voltar para a página inicial">
            <Logo />
          </Link>
        </div>

        <div className="auth-pro-brand-content">
          <span className="auth-pro-eyebrow">
            <Sparkles size={15} />
            Gestão completa do seu cardápio
          </span>

          <h1>
            Seu negócio online,
            <span> organizado em um só lugar.</span>
          </h1>

          <p>
            Entre no painel do Menufy para gerenciar produtos, categorias, pedidos,
            QR Code, aparência e toda a operação do seu estabelecimento.
          </p>

          <div className="auth-pro-feature-list">
            <article>
              <span><Check size={15} /></span>
              <div>
                <strong>Cardápio profissional</strong>
                <small>Produtos, categorias, promoções e disponibilidade.</small>
              </div>
            </article>

            <article>
              <span><Check size={15} /></span>
              <div>
                <strong>Pedidos organizados</strong>
                <small>Acompanhe o fluxo de pedidos em tempo real.</small>
              </div>
            </article>

            <article>
              <span><Check size={15} /></span>
              <div>
                <strong>Controle pelo celular</strong>
                <small>Painel responsivo e PWA instalável.</small>
              </div>
            </article>
          </div>
        </div>

        <div className="auth-pro-brand-footer">
          <ShieldCheck size={16} />
          <span>Ambiente protegido por autenticação Supabase.</span>
        </div>
      </section>

      <section className="auth-pro-form-panel">
        <div className="auth-pro-mobile-logo">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="auth-pro-card">
          <div className="auth-pro-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Entrar
            </button>

            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              Criar conta
            </button>
          </div>

          <div className="auth-pro-heading">
            <span className="auth-pro-icon">
              {mode === "login" ? <LockKeyhole size={21} /> : <UserRound size={21} />}
            </span>

            <div>
              <h2>{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta Menufy"}</h2>
              <p>
                {mode === "login"
                  ? "Entre com seus dados para acessar o painel."
                  : "Comece criando sua conta para configurar o estabelecimento."}
              </p>
            </div>
          </div>

          <form className="auth-pro-form" onSubmit={submit}>
            {mode === "signup" && (
              <label>
                Nome
                <div className="auth-pro-input">
                  <UserRound size={17} />
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </label>
            )}

            <label>
              Email
              <div className="auth-pro-input">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>
            </label>

            <label>
              <span className="auth-pro-label-row">
                <span>Senha</span>
                {mode === "login" && (
                  <Link to="/esqueci-senha">Esqueci minha senha</Link>
                )}
              </span>

              <div className="auth-pro-input">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "login" ? "Sua senha" : "Crie uma senha forte"}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <>
                <div className="auth-password-strength">
                  <div className={`auth-password-bars score-${score}`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className={index < score ? "active" : ""} />
                    ))}
                  </div>

                  <div className="auth-password-strength-text">
                    <span>Força da senha</span>
                    <strong>{password ? passwordLabel(score) : "—"}</strong>
                  </div>

                  <div className="auth-password-rules">
                    <span className={password.length >= 8 ? "ok" : ""}>
                      <Check size={12} />
                      8 caracteres
                    </span>

                    <span className={/[A-Z]/.test(password) ? "ok" : ""}>
                      <Check size={12} />
                      Maiúscula
                    </span>

                    <span className={/[a-z]/.test(password) ? "ok" : ""}>
                      <Check size={12} />
                      Minúscula
                    </span>

                    <span className={/\d/.test(password) ? "ok" : ""}>
                      <Check size={12} />
                      Número
                    </span>
                  </div>
                </div>

                <label>
                  Confirmar senha
                  <div className="auth-pro-input">
                    <LockKeyhole size={17} />
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() =>
                        setShowPasswordConfirm((current) => !current)
                      }
                      aria-label={
                        showPasswordConfirm ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPasswordConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {passwordConfirm && (
                    <span
                      className={`auth-password-match ${
                        password === passwordConfirm ? "ok" : "error"
                      }`}
                    >
                      {password === passwordConfirm
                        ? "As senhas coincidem."
                        : "As senhas ainda não coincidem."}
                    </span>
                  )}
                </label>
              </>
            )}

            {mode === "login" && (
              <label className="auth-remember-row">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(event) => setRememberEmail(event.target.checked)}
                />
                <span>Lembrar meu email neste dispositivo</span>
              </label>
            )}

            {message && (
              <div className={`auth-pro-message ${messageType}`}>
                {messageType === "success" && <Check size={16} />}
                {messageType === "info" && <ShieldCheck size={16} />}
                {messageType === "error" && <LockKeyhole size={16} />}
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className="button button-large button-full auth-pro-submit"
              disabled={loading}
            >
              {loading
                ? mode === "login"
                  ? "Entrando..."
                  : "Criando conta..."
                : mode === "login"
                  ? "Entrar no painel"
                  : "Criar minha conta"}

              {!loading && <ArrowRight size={18} />}
            </button>

            {mode === "signup" && (
              <p className="auth-pro-terms">
                Ao criar sua conta, você concorda em usar o Menufy de forma
                responsável e manter seus dados de acesso protegidos.
              </p>
            )}
          </form>

          <div className="auth-pro-switch">
            <span>
              {mode === "login"
                ? "Ainda não possui uma conta?"
                : "Já possui uma conta?"}
            </span>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMessage("");
              }}
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>

        <div className="auth-pro-help">
          <span>Problemas para acessar?</span>
          <Link to="/esqueci-senha">Recuperar senha</Link>
          <span>•</span>
          <Link to="/">Voltar ao início</Link>
        </div>
      </section>
    </main>
  );
}
