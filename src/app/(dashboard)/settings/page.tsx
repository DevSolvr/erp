"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, User, Key, Info } from "lucide-react";
import { Header } from "@/components/Header";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({ name: session?.user?.name || "", email: session?.user?.email || "" });
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = (session?.user as any)?.id;
    setLoading(true); setError(""); setSuccess("");
    const res = await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name, email: profile.email }) });
    if (res.ok) setSuccess("Perfil atualizado com sucesso!");
    else setError("Erro ao atualizar perfil");
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirm) { setError("As senhas não coincidem"); return; }
    if (passwords.password.length < 6) { setError("A senha deve ter no mínimo 6 caracteres"); return; }
    const userId = (session?.user as any)?.id;
    setLoading(true); setError(""); setSuccess("");
    const res = await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passwords.password }) });
    if (res.ok) { setSuccess("Senha alterada com sucesso!"); setPasswords({ password: "", confirm: "" }); }
    else setError("Erro ao alterar senha");
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Configurações" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {(success || error) && (
          <div className={`px-4 py-3 rounded-lg text-sm ${success ? "bg-green-400/10 text-green-400 border border-green-400/20" : "bg-red-400/10 text-red-400 border border-red-400/20"}`}>
            {success || error}
          </div>
        )}

        {/* Profile */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <User size={14} className="text-emerald-400" /> Meu Perfil
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome</label>
              <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input type="email" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
              {loading ? "Salvando..." : "Salvar Perfil"}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Key size={14} className="text-cyan-400" /> Alterar Senha
          </h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nova Senha</label>
              <input type="password" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={passwords.password} onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Confirmar Nova Senha</label>
              <input type="password" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
              {loading ? "Alterando..." : "Alterar Senha"}
            </button>
          </form>
        </div>

        {/* System Info */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={14} style={{ color: "var(--text-muted)" }} /> Sistema
          </h2>
          <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex justify-between">
              <span>Versão</span>
              <span className="terminal-tag">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Plataforma</span>
              <span className="text-white">DevSolvr ERP</span>
            </div>
            <div className="flex justify-between">
              <span>Função atual</span>
              <span className="text-white">{(session?.user as any)?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
