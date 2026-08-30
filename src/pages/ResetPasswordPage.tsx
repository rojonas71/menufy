import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

type Rule = { label: string; valid: boolean };

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const rules = useMemo<Rule[]>(() => [
    { label: "Pelo menos 8 caracteres", valid: password.length >= 8 },
    { label: "Uma letra maiúscula", valid: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Um número", valid: /\\d/.test(password) }
  ], [password]);

  const validRuleCount = rules.filter(r => r.valid).length;
  const passwordValid = rules.every(r => r.valid);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const strengthLabel = validRuleCount <= 1 ? "Fraca" : validRuleCount === 2 ? "Razoável" : validRuleCount === 3 ? "Boa" : "Forte";

  useEffect(() => {
    const client = supabase;
    if (!client) { setErrorMessage("Supabase não configurado."); setChecking(false); return; }
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setRecoveryReady(true);
      setChecking(false);
    });

    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (["PASSWORD_RECOVERY", "SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
        setRecoveryReady(true); setChecking(false);
      }
    });

    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    setMessage(""); setErrorMessage("");

    if (!passwordValid) { setErrorMessage("Sua senha ainda não atende aos requisitos de segurança."); return; }
    if (!passwordsMatch) { setErrorMessage("As senhas não são iguais."); return; }

    setLoading(true);
    const { error } = await client.auth.updateUser({ password });
    if (error) { setErrorMessage(error.message); setLoading(false); return; }

    setMessage("Senha atualizada com sucesso.");
    window.setTimeout(() => navigate("/dashboard", { replace: true }), 1300);
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card reset-password-card">
        <Logo />
        <div className="auth-heading">
          <span className="eyebrow">Segurança da conta</span>
          <h1>Criar nova senha</h1>
          <p>Escolha uma senha forte e diferente das que você usa em outros serviços.</p>
        </div>

        {checking ? (
          <div className="auth-info-message"><ShieldCheck size={18} /> Validando seu link de recuperação...</div>
        ) : recoveryReady ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Nova senha
              <div className="auth-input-with-icon">
                <LockKeyhole size={18} />
                <input type={showPassword ? "text" : "password"} value={password} autoComplete="new-password" placeholder="Digite sua nova senha" onChange={e => setPassword(e.target.value)} />
                <button className="password-visibility-button" type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </label>

            <div className="password-strength">
              <div className="password-strength-head"><span>Força da senha</span><strong>{strengthLabel}</strong></div>
              <div className="password-strength-bars">{[1,2,3,4].map(level => <span key={level} className={level <= validRuleCount ? "active" : ""} />)}</div>
            </div>

            <div className="password-rules">
              {rules.map(rule => <div key={rule.label} className={rule.valid ? "valid" : ""}>{rule.valid ? <Check size={15} /> : <X size={15} />}<span>{rule.label}</span></div>)}
            </div>

            <label>
              Confirmar nova senha
              <div className="auth-input-with-icon">
                <KeyRound size={18} />
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} autoComplete="new-password" placeholder="Digite novamente" onChange={e => setConfirmPassword(e.target.value)} />
                <button className="password-visibility-button" type="button" onClick={() => setShowConfirm(v => !v)}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </label>

            {confirmPassword && <div className={passwordsMatch ? "password-match valid" : "password-match"}>{passwordsMatch ? <Check size={15} /> : <X size={15} />}{passwordsMatch ? "As senhas são iguais" : "As senhas ainda não são iguais"}</div>}
            {message && <div className="auth-success-message"><CheckCircle2 size={18} /><div><strong>Senha alterada</strong><span>{message}</span></div></div>}
            {errorMessage && <div className="auth-error-message">{errorMessage}</div>}

            <button className="button button-large auth-submit" disabled={loading || !passwordValid || !passwordsMatch}>{loading ? "Atualizando..." : "Salvar nova senha"}</button>
          </form>
        ) : (
          <div className="expired-recovery">
            <div className="auth-error-message">Este link é inválido, expirou ou já foi utilizado.</div>
            <Link className="button button-large auth-submit" to="/esqueci-senha">Solicitar novo link</Link>
            <Link className="auth-back-link" to="/login">Voltar para entrar</Link>
          </div>
        )}
      </section>
    </main>
  );
}
