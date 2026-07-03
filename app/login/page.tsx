import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/ui";

export default function LoginPage() {
  if (!isSupabaseConfigured()) redirect("/scenarios");
  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back to SiteSafe.</p>
        <AuthForm mode="login" />
        <p className="mt-4 text-sm text-slate-500">
          No account?{" "}
          <Link href="/signup" className="text-brand-700 underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
