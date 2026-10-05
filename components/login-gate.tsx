"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { clearSession, readSession, verifyCredentials, writeSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AuthContext = createContext<{ signOut: () => void } | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside LoginGate");
  return value;
}

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "login" | "in">("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(readSession() ? "in" : "login");
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter both username and password.");
      return;
    }
    setBusy(true);
    try {
      const ok = await verifyCredentials(username, password);
      if (!ok) {
        setError("Wrong username or password.");
        setPassword("");
        return;
      }
      writeSession();
      setPassword("");
      setState("in");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <p className="text-sm text-muted-foreground">Opening SIM Flight Testing…</p>
      </div>
    );
  }

  if (state === "login") {
    return (
      <div className="grid min-h-svh place-items-center bg-background px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4" />
            </div>
            <CardTitle>SIM Flight Testing</CardTitle>
            <CardDescription>Sign in to open the checklist. This access is private.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <div className="space-y-1.5">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  name="username"
                  autoComplete="username"
                  data-testid="login-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  data-testid="login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" data-testid="login-error" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy} data-testid="login-submit">
                {busy ? "Checking…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        signOut: () => {
          clearSession();
          setUsername("");
          setPassword("");
          setError("");
          setState("login");
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
