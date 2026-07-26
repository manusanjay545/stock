"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Set New Password
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="glass-card p-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">Password Updated!</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully reset. Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="glass-card p-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8}
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)] transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.1)] transition-all" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-900 font-bold text-sm hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
