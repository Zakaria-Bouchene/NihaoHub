import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { BookOpenText, LogOut, Moon, Sun } from "lucide-react";
import { getStoredPair, getLanguage } from "@/lib/languages";

export function SiteHeader() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [pair, setPair] = useState(getStoredPair());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  // Keep pair badge in sync with localStorage changes
  useEffect(() => {
    function onStorage() { setPair(getStoredPair()); }
    window.addEventListener("storage", onStorage);
    // Also refresh on focus (in case the pair changed in the same tab via setState)
    const interval = setInterval(() => setPair(getStoredPair()), 2000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  async function signOut() {
    await firebaseSignOut(auth);
    navigate({ to: "/", replace: true });
  }

  const sourceLangObj = getLanguage(pair.sourceLang);
  const targetLangObj = getLanguage(pair.targetLang);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-serif-display text-lg font-semibold tracking-tight">
          <BookOpenText className="h-5 w-5 text-primary" />
          <span>Langs<span className="text-primary">Hub</span></span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <NavLink to="/browse">Browse</NavLink>
          {email && <NavLink to="/study">Study</NavLink>}
          {email && <NavLink to="/reading">Reading</NavLink>}
          {email && <NavLink to="/collections">Collections</NavLink>}
          {email && <NavLink to="/contribute">Contribute</NavLink>}
          {email && <NavLink to="/stats">Stats</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language pair badge — clickable, routes to /study for quick switch */}
          {email && (
            <Link
              to="/study"
              title="Change language pair"
              className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <span>{sourceLangObj?.flag ?? pair.sourceLang}</span>
              <span className="opacity-50">→</span>
              <span className="font-medium text-primary">{targetLangObj?.flag ?? pair.targetLang}</span>
            </Link>
          )}

          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {email ? (
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeProps={{ className: "rounded-md px-3 py-1.5 bg-muted text-foreground font-medium" }}
    >
      {children}
    </Link>
  );
}