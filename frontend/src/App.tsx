import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Landing } from "./pages/Landing";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        className="flex min-h-svh items-center justify-center font-mono text-sm"
        style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-tertiary)" }}
      >
        connecting…
      </div>
    );
  }

  if (session) return <Dashboard session={session} />;
  if (showLogin) return <Login />;
  return <Landing onSignIn={() => setShowLogin(true)} />;
}

export default App;
