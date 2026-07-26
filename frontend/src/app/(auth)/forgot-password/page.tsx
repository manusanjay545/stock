"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {sent ? (
          <div className="glass-card p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Check Your Email</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to <strong className="text-foreground">{email}</strong>. 
              Click the link in your email to reset your password.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button onClick={() => setSent(false)} className="text-primary hover:text-primary-hover font-semibold">
                try again
              </button>
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="glass-card p-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)] transition-all" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-900 font-bold text-sm hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
