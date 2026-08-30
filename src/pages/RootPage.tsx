import { useEffect, useState } from "react";
import { LandingPage } from "./LandingPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { supabase } from "../lib/supabase";

function hasRecoveryParams() {
  const hash = window.location.hash || "";
  const search = window.location.search || "";

  return (
    hash.includes("type=recovery") ||
    search.includes("type=recovery") ||
    hash.includes("access_token=") ||
    search.includes("code=")
  );
}

export function RootPage() {
  const [recoveryMode, setRecoveryMode] = useState(hasRecoveryParams());

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return recoveryMode ? <ResetPasswordPage /> : <LandingPage />;
}
