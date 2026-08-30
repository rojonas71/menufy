import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setErrorMessage("Supabase não configurado.");
      setChecking(false);
      return;
    }

    let mounted = true;

    const checkSession = async () => {
      const { data } = await client.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        setRecoveryReady(true);
      }

      setChecking(false);
    };

    checkSession();

    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const client = supabase;
    if (!client) return;

    setMessage("");
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const { error } = await client.auth.updateUser({
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Senha atualizada com sucesso.");

    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1200);

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card reset-password-card">
        <Logo />

        <div className="auth-heading">
          <span className="eyebrow">Nova senha</span>
          <h1>Redefinir senha</h1>
          <p>
            Crie uma nova senha segura para voltar a acessar sua conta.
          </p>
        </div>

        {checking ? (
          <div className="auth-info-message">
            Validando seu link de recuperação...
          </div>
        ) : recoveryReady ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Nova senha
              <div className="auth-input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>

            <label>
              Confirmar nova senha
              <div className="auth-input-with-icon">
                <KeyRound size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </label>

            {message && (
              <div className="auth-success-message">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="auth-error-message">
                {errorMessage}
              </div>
            )}

            <button className="button button-large auth-submit" disabled={loading}>
              {loading ? "Atualizando..." : "Salvar nova senha"}
            </button>
          </form>
        ) : (
          <>
            <div className="auth-error-message">
              Este link de recuperação é inválido, expirou ou já foi utilizado.
            </div>

            <Link className="button button-large auth-submit" to="/esqueci-senha">
              Solicitar novo link
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
