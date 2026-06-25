"use client";

import { useEffect, useState } from "react";
import {
  Plus, Eye, EyeOff, Copy, Check, Trash2, ShieldCheck,
  Key, Database, Server, Globe, Smartphone, CreditCard, Lock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";

const CATEGORIES = [
  { value: "DATABASE",  label: "Banco de Dados",    icon: Database,    color: "#3b82f6" },
  { value: "API",       label: "API / Chaves",       icon: Key,         color: "#a855f7" },
  { value: "HOSTING",   label: "Hospedagem",         icon: Server,      color: "#10d9a0" },
  { value: "WEBSITE",   label: "Site / Painel",      icon: Globe,       color: "#06b6d4" },
  { value: "SOCIAL",    label: "Redes Sociais",      icon: Smartphone,  color: "#ec4899" },
  { value: "FINANCIAL", label: "Financeiro",         icon: CreditCard,  color: "#f59e0b" },
  { value: "OTHER",     label: "Outros",             icon: Lock,        color: "#64748b" },
];

const catMeta = (value: string) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

export default function VaultPage() {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied]     = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [form, setForm] = useState({ label: "", value: "", category: "OTHER", notes: "" });

  const fetchItems = () =>
    fetch("/api/vault").then((r) => r.json()).then(setItems).finally(() => setLoading(false));

  useEffect(() => { fetchItems(); }, []);

  const toggleReveal = (id: string) =>
    setRevealed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copyValue = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/vault", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ label: "", value: "", category: "OTHER", notes: "" });
    fetchItems();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta credencial do cofre?")) return;
    await fetch(`/api/vault?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = items.filter((i) => {
    const matchCat = !catFilter || i.category === catFilter;
    const matchSearch = !search || i.label.toLowerCase().includes(search.toLowerCase()) || (i.notes || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((i) => i.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Cofre"
        subtitle="Senhas e credenciais — visível apenas para você"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> Adicionar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(16,217,160,0.07)", border: "1px solid rgba(16,217,160,0.15)" }}>
          <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>
            Informações armazenadas de forma segura no banco de dados. Apenas o <strong className="text-white">Admin</strong> tem acesso a esta seção.
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input-field px-3 py-2 rounded-lg text-sm flex-1 min-w-48"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCatFilter("")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={!catFilter ? { background: "rgba(16,217,160,0.15)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.3)" } : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Todos
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCatFilter(catFilter === c.value ? "" : c.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={catFilter === c.value ? { background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}40` } : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="card p-16 text-center">
            <ShieldCheck size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium text-white mb-1">Cofre vazio</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Guarde aqui senhas de ferramentas, painéis, APIs, bancos de dados e contas que você usa na agência.
            </p>
            <button onClick={() => setShowAdd(true)} className="mt-5 text-sm font-medium" style={{ color: "var(--accent)" }}>
              + Adicionar primeira credencial
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma credencial encontrada para este filtro</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.value}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color: group.color }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {group.label}
                    </p>
                    <span className="text-[10px] px-1.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                      {group.items.length}
                    </span>
                  </div>

                  <div className="card overflow-hidden">
                    {group.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-4 py-3 group"
                        style={idx > 0 ? { borderTop: "1px solid var(--border)" } : {}}
                      >
                        {/* label */}
                        <div className="w-48 flex-shrink-0">
                          <p className="text-xs font-mono font-semibold text-white truncate">{item.label}</p>
                          {item.notes && (
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{item.notes}</p>
                          )}
                        </div>

                        {/* value */}
                        <div className="flex-1 min-w-0">
                          <code
                            className="text-xs font-mono block truncate select-all"
                            style={{ color: revealed.has(item.id) ? "var(--accent)" : "var(--text-muted)" }}
                          >
                            {revealed.has(item.id) ? item.value : "•".repeat(Math.min(item.value.length, 32))}
                          </code>
                        </div>

                        {/* actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="p-1.5 rounded-lg btn-ghost"
                            title={revealed.has(item.id) ? "Ocultar" : "Revelar"}
                          >
                            {revealed.has(item.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => copyValue(item.id, item.value)}
                            className="p-1.5 rounded-lg btn-ghost"
                            title="Copiar"
                          >
                            {copied === item.id
                              ? <Check size={13} style={{ color: "var(--accent)" }} />
                              : <Copy size={13} />}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg btn-ghost hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Adicionar ao Cofre" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome / Label *</label>
              <input
                className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Ex: VERCEL_TOKEN, senha_cpanel..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoria</label>
              <select
                className="input-field w-full px-3 py-2 rounded-lg text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Valor / Senha *</label>
              <input
                className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="Valor, senha ou chave..."
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Observação</label>
              <input
                className="input-field w-full px-3 py-2 rounded-lg text-sm"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: conta da Vercel, token expira em..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
              {saving ? "Salvando..." : "Salvar no Cofre"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
