"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Button, Input, Label, Select } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState("delegate");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createBrowserSupabase();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setInfo("Account created. If email confirmation is enabled, check your inbox, then log in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {mode === "signup" && (
        <div>
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
      )}
      <div>
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      {mode === "signup" && (
        <div>
          <Label>Role</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="delegate">Delegate</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </Select>
          <p className="mt-1 text-xs text-slate-400">
            For the MVP, roles are self-selected. In production trainers/admins are provisioned by an
            organisation owner.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-emerald-700">{info}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
