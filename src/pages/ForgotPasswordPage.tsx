import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const client = supabase;
    if (!client) {
      setErrorMessage("Supabase não configurado.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Digite seu email.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const redirectTo = `${window.location.origin}/redefinir-senha`;

    const { error } = await client.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo }
    );

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage(
        "Se esse email estiver cadastrado, você receberá um link para redefinir sua senha."
      );
    }

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card forgot-password-card">
        <Logo />

        <div className="auth-heading">
          <span className="eyebrow">Recuperação de acesso</span>
          <h1>Esqueci minha senha</h1>
          <p>
            Informe o email da sua conta. Vamos enviar um link seguro para você
            criar uma nova senha.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="auth-error-message">
              {errorMessage}
            </div>
          )}

          <button className="button button-large auth-submit" disabled={loading}>
            <Send size={18} />
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <Link className="auth-back-link" to="/login">
          <ArrowLeft size={16} />
          Voltar para entrar
        </Link>
      </section>
    </main>
  );
}
