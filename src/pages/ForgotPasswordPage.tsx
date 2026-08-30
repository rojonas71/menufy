import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

type Mode = "request" | "reset";
type Rule = { label: string; valid: boolean };
const COOLDOWN = 60;

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("request");
  const [checkingRecovery, setCheckingRecovery] = useState(true);

  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [seconds, setSeconds] = useState(0);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email]
  );

  const rules = useMemo<Rule[]>(
    () => [
      { label: "Pelo menos 8 caracteres", valid: password.length >= 8 },
      { label: "Uma letra maiúscula", valid: /[A-Z]/.test(password) },
      { label: "Uma letra minúscula", valid: /[a-z]/.test(password) },
      { label: "Um número", valid: /\d/.test(password) }
    ],
    [password]
  );

  const validRuleCount = rules.filter((rule) => rule.valid).length;
  const passwordValid = rules.every((rule) => rule.valid);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const strengthLabel =
    validRuleCount <= 1
      ? "Fraca"
      : validRuleCount === 2
        ? "Razoável"
        : validRuleCount === 3
          ? "Boa"
          : "Forte";

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setErrorMessage("Supabase não configurado.");
      setCheckingRecovery(false);
      return;
    }

    let mounted = true;

    const checkRecovery = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const recoveryHint =
        searchParams.get("type") === "recovery" ||
        hashParams.get("type") === "recovery" ||
        Boolean(searchParams.get("code")) ||
        Boolean(hashParams.get("access_token"));

      const { data } = await client.auth.getSession();

      if (!mounted) return;

      if (data.session && recoveryHint) {
        setMode("reset");
      }

      setCheckingRecovery(false);
    };

    checkRecovery();

    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setCheckingRecovery(false);
        setMessage("");
        setErrorMessage("");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendRecovery = async (targetEmail: string) => {
    const client = supabase;

    if (!client) {
      setErrorMessage("Supabase não configurado.");
      return;
    }

    if (!targetEmail) {
      setErrorMessage("Digite seu email.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const redirectTo = `${window.location.origin}/esqueci-senha`;

    const { error } = await client.auth.resetPasswordForEmail(targetEmail, {
      redirectTo
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSentEmail(targetEmail);
      setSeconds(COOLDOWN);
      setMessage(
        "Se esse email estiver cadastrado, você receberá um link seguro. Ao abrir o link, esta mesma página mostrará o formulário para criar sua nova senha."
      );
    }

    setLoading(false);
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendRecovery(normalizedEmail);
  };

  const resend = async () => {
    if (!sentEmail || seconds > 0 || loading) return;
    await sendRecovery(sentEmail);
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    const client = supabase;
    if (!client) return;

    setMessage("");
    setErrorMessage("");

    if (!passwordValid) {
      setErrorMessage("Sua senha ainda não atende aos requisitos de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const { error } = await client.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Senha atualizada com sucesso. Entrando no painel...");

    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1300);

    setLoading(false);
  };

  if (checkingRecovery) {
    return (
      <main className="auth-page">
        <section className="auth-card forgot-password-card">
          <Logo />
          <div className="auth-heading">
            <span className="eyebrow">Segurança da conta</span>
            <h1>Validando acesso...</h1>
          </div>
          <div className="auth-info-message">
            <ShieldCheck size={18} />
            Verificando seu link de recuperação.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card forgot-password-card">
        <Logo />

        {mode === "request" ? (
          <>
            <div className="auth-heading">
              <span className="eyebrow">Recuperação de acesso</span>
              <h1>Esqueci minha senha</h1>
              <p>
                Informe o email usado no Menufy. Enviaremos um link seguro para
                esta mesma página.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleRequest}>
              <label>
                Email
                <div className="auth-input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              {message && (
                <div className="auth-success-message">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Link solicitado</strong>
                    <span>{message}</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="auth-error-message">{errorMessage}</div>
              )}

              <button className="button button-large auth-submit" disabled={loading}>
                <Send size={18} />
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            {sentEmail && (
              <div className="recovery-resend">
                <p>Não recebeu o email?</p>
                <button
                  type="button"
                  onClick={resend}
                  disabled={seconds > 0 || loading}
                >
                  <RefreshCw size={15} />
                  {seconds > 0 ? `Reenviar em ${seconds}s` : "Reenviar email"}
                </button>
              </div>
            )}

            <div className="recovery-help">
              <strong>Como funciona:</strong>
              <span>1. Você informa seu email.</span>
              <span>2. O Menufy envia o link seguro.</span>
              <span>3. Você abre o link recebido.</span>
              <span>4. Esta mesma página muda para “Criar nova senha”.</span>
            </div>

            <Link className="auth-back-link" to="/login">
              <ArrowLeft size={16} />
              Voltar para entrar
            </Link>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <span className="eyebrow">Segurança da conta</span>
              <h1>Criar nova senha</h1>
              <p>
                Seu link foi validado. Agora escolha uma nova senha para sua conta.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleReset}>
              <label>
                Nova senha
                <div className="auth-input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="new-password"
                    placeholder="Digite sua nova senha"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="password-strength">
                <div className="password-strength-head">
                  <span>Força da senha</span>
                  <strong>{strengthLabel}</strong>
                </div>
                <div className="password-strength-bars">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={level <= validRuleCount ? "active" : ""}
                    />
                  ))}
                </div>
              </div>

              <div className="password-rules">
                {rules.map((rule) => (
                  <div key={rule.label} className={rule.valid ? "valid" : ""}>
                    {rule.valid ? <Check size={15} /> : <X size={15} />}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              <label>
                Confirmar nova senha
                <div className="auth-input-with-icon">
                  <KeyRound size={18} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    autoComplete="new-password"
                    placeholder="Digite novamente"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowConfirm((value) => !value)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {confirmPassword && (
                <div className={passwordsMatch ? "password-match valid" : "password-match"}>
                  {passwordsMatch ? <Check size={15} /> : <X size={15} />}
                  {passwordsMatch
                    ? "As senhas são iguais"
                    : "As senhas ainda não são iguais"}
                </div>
              )}

              {message && (
                <div className="auth-success-message">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Senha alterada</strong>
                    <span>{message}</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="auth-error-message">{errorMessage}</div>
              )}

              <button
                className="button button-large auth-submit"
                disabled={loading || !passwordValid || !passwordsMatch}
              >
                {loading ? "Atualizando..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
