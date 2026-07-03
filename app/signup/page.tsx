import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthForm } from "@/components/AuthForm";
import { Card } from "@/components/ui";

export default function SignupPage() {
  if (!isSupabaseConfigured()) redirect("/scenarios");
  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Start training in minutes.</p>
        <AuthForm mode="signup" />
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-brand-700 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
