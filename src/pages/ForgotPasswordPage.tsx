import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendRecovery = async (event: FormEvent) => {
    event.preventDefault();

    const client = supabase;

    if (!client || !isSupabaseConfigured) {
      setMessage("Supabase não está configurado.");
      return;
    }

    if (cooldown > 0) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Informe seu email.");
      return;
    }

    setLoading(true);
    setMessage("");

    const redirectTo = `${window.location.origin}/`;

    const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo
    });

    if (error) {
      const raw = error.message.toLowerCase();

      if (raw.includes("rate limit")) {
        setMessage("Muitas tentativas em pouco tempo. Aguarde um pouco antes de tentar novamente.");
      } else if (raw.includes("error sending recovery email")) {
        setMessage("Não foi possível enviar o email de recuperação. Verifique a configuração de email do projeto.");
      } else {
        setMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setSentTo(normalizedEmail);
    setCooldown(60);
    setLoading(false);
  };

  return (
    <main className="auth-simple-page">
      <div className="auth-simple-shell">
        <Link className="auth-simple-logo" to="/">
          <Logo />
        </Link>

        <section className="auth-simple-card">
          <Link className="auth-back-link" to="/login">
            <ArrowLeft size={16} />
            Voltar ao login
          </Link>

          <span className="auth-simple-icon">
            <Mail size={22} />
          </span>

          <h1>Recuperar sua senha</h1>
          <p>
            Informe o email da sua conta. Se ele estiver cadastrado, enviaremos
            um link seguro para você criar uma nova senha.
          </p>

          {!sentTo ? (
            <form onSubmit={sendRecovery} className="auth-simple-form">
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

              {message && (
                <div className="auth-pro-message error">
                  <ShieldCheck size={16} />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                className="button button-large button-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <div className="auth-recovery-success">
              <span>
                <Check size={21} />
              </span>

              <h2>Confira seu email</h2>

              <p>
                Se existir uma conta para <strong>{sentTo}</strong>, você receberá
                um link para redefinir sua senha.
              </p>

              <div className="auth-recovery-hint">
                <ShieldCheck size={17} />
                <span>
                  Confira também as pastas de spam, promoções ou lixo eletrônico.
                </span>
              </div>

              <button
                type="button"
                className="button button-outline button-full"
                disabled={loading || cooldown > 0}
                onClick={(event) => {
                  setSentTo("");
                  if (cooldown <= 0) sendRecovery(event as unknown as FormEvent);
                }}
              >
                <Clock3 size={16} />
                {cooldown > 0
                  ? `Reenviar em ${cooldown}s`
                  : "Enviar novamente"}
              </button>

              <Link className="button button-full" to="/login">
                Voltar ao login
              </Link>
            </div>
          )}
        </section>

        <p className="auth-simple-footer">
          Menufy • Recuperação segura de acesso
        </p>
      </div>
    </main>
  );
}
