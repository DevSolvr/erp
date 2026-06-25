"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Code2, Lock, Mail, AlertCircle, Loader2,
  FolderKanban, Users, DollarSign, CheckSquare, ArrowRight,
} from "lucide-react";

const features = [
  { icon: FolderKanban, text: "Gestão de projetos com kanban" },
  { icon: Users, text: "Controle de equipe e acessos por nível" },
  { icon: DollarSign, text: "Financeiro: receitas, despesas e investimentos" },
  { icon: CheckSquare, text: "Tarefas com prioridade e responsáveis" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Email ou senha inválidos");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* LEFT — brand side */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-14 relative overflow-hidden" style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}>
        {/* decorative glows */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,217,160,0.08) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />

        {/* logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
            <Code2 size={20} className="text-black" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">DevSolvr</span>
            <span className="text-xs ml-2 terminal-tag">ERP</span>
          </div>
        </div>

        {/* main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="terminal-tag text-sm mb-4">&gt; sistema --inicializando</p>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Sua agência,<br />
              <span className="gradient-text">totalmente</span><br />
              organizada.
            </h1>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Gerencie projetos, equipe e finanças em um só lugar.
              Do orçamento à entrega, com controle total.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,217,160,0.12)", border: "1px solid rgba(16,217,160,0.2)" }}>
                  <Icon size={14} style={{ color: "var(--accent)" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* bottom stat strip */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "100%", label: "Controle total" },
            { value: "3 níveis", label: "De acesso" },
            { value: "Tempo real", label: "Atualizações" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #10d9a0, transparent)" }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
        </div>

        <div className="w-full max-w-sm relative">
          {/* mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
              <Code2 size={26} className="text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white">DevSolvr ERP</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Entre com sua conta para acessar o painel
            </p>
          </div>

          <div className="card p-8" style={{ border: "1px solid rgba(16,217,160,0.15)" }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-red-400/10 text-red-400 border border-red-400/20">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Entrando...</>
                ) : (
                  <><span>Entrar no Sistema</span><ArrowRight size={15} /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            DevSolvr ERP · Sistema Interno
          </p>
        </div>
      </div>
    </div>
  );
}
