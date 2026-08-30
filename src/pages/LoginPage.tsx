import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setMessage("Configure o Supabase no arquivo .env para ativar autenticação real.");
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMessage(error.message);
      navigate("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMessage(error.message);
      setMessage("Conta criada. Confira seu e-mail se a confirmação estiver habilitada.");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/"><Logo /></Link>
        <h1>{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
        <p>{mode === "login" ? "Entre para gerenciar seu cardápio." : "Comece seu cardápio digital."}</p>
        <form onSubmit={submit} className="form-grid">
          <label>
            E-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Senha
            <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {message && <div className="form-message">{message}</div>}
          <button className="button button-full">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <div className="login-help-row">
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </div>
        </form>
        <button className="text-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}
        </button>
      </div>
    </main>
  );
}
