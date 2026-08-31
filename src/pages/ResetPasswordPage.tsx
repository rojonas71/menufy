import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

function scorePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const score = useMemo(() => scorePassword(password), [password]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const client = supabase;

    if (!client || !isSupabaseConfigured) {
      setMessage("Supabase não está configurado.");
      return;
    }

    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setMessage("Use letra maiúscula, minúscula e número.");
      return;
    }

    if (password !== confirm) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await client.auth.updateUser({ password });

    if (error) {
      const raw = error.message.toLowerCase();

      if (
        raw.includes("expired") ||
        raw.includes("invalid") ||
        raw.includes("session")
      ) {
        setMessage("Este link de recuperação é inválido ou expirou. Solicite um novo link.");
      } else {
        setMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/login?reset=1", { replace: true });
  };

  return (
    <main className="auth-simple-page">
      <div className="auth-simple-shell">
        <div className="auth-simple-logo">
          <Logo />
        </div>

        <section className="auth-simple-card">
          <span className="auth-simple-icon">
            <LockKeyhole size={22} />
          </span>

          <h1>Crie uma nova senha</h1>

          <p>
            Escolha uma senha segura para proteger sua conta Menufy.
          </p>

          <form onSubmit={submit} className="auth-simple-form">
            <label>
              Nova senha
              <div className="auth-pro-input">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nova senha"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="auth-password-strength">
              <div className={`auth-password-bars score-${score}`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className={index < score ? "active" : ""} />
                ))}
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
              Confirmar nova senha
              <div className="auth-pro-input">
                <LockKeyhole size={17} />
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Digite novamente"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirm((current) => !current)}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {confirm && (
                <span
                  className={`auth-password-match ${
                    password === confirm ? "ok" : "error"
                  }`}
                >
                  {password === confirm
                    ? "As senhas coincidem."
                    : "As senhas não coincidem."}
                </span>
              )}
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
              {loading ? "Salvando..." : "Salvar nova senha"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </section>

        <p className="auth-simple-footer">
          Menufy • Proteção de acesso
        </p>
      </div>
    </main>
  );
}
