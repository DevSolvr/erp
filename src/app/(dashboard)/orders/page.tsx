"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ClipboardList, Building, ArrowRight, XCircle, TrendingDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order, Project, Quote } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  PENDING:     { label: "Pendente",     color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", next: "CONFIRMED",   nextLabel: "Confirmar" },
  CONFIRMED:   { label: "Confirmado",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20",       next: "IN_PROGRESS", nextLabel: "Iniciar" },
  IN_PROGRESS: { label: "Em Andamento", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",       next: "DELIVERED",   nextLabel: "Entregar" },
  DELIVERED:   { label: "Entregue",     color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  CANCELLED:   { label: "Cancelado",    color: "text-red-400 bg-red-400/10 border-red-400/20" },
  LOST:        { label: "Perdido",      color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

function OrderForm({ projects, quotes, onSubmit, loading }: { projects: Project[]; quotes: Quote[]; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ title: "", clientName: "", projectId: "", quoteId: "", description: "", total: "" });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleQuoteChange = (quoteId: string) => {
    const q = quotes.find((q) => q.id === quoteId);
    setForm((f) => ({
      ...f,
      quoteId,
      ...(q ? {
        clientName: q.clientName,
        total: String(q.total),
        title: q.title,
        ...(q.projectId ? { projectId: q.projectId } : {}),
      } : {}),
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {quotes.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Importar de um Orçamento (opcional)</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.quoteId} onChange={(e) => handleQuoteChange(e.target.value)}>
            <option value="">Sem orçamento vinculado</option>
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>{q.number} — {q.title} · {q.clientName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título do Pedido *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Desenvolvimento App Mobile XYZ" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cliente *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Nome do cliente" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Valor Total (R$)</label>
          <input type="number" step="0.01" min="0" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.total} onChange={(e) => set("total", e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Projeto</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Descrição / Escopo</label>
        <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalhe o que está incluído neste pedido..." />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
          {loading ? "Criando..." : "Criar Pedido"}
        </button>
      </div>
    </form>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = () => Promise.all([
    fetch("/api/orders").then((r) => r.json()).then(setOrders),
    fetch("/api/projects").then((r) => r.json()).then(setProjects),
    fetch("/api/quotes").then((r) => r.json()).then(setQuotes),
  ]).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowCreate(false); fetchData(); }
    setFormLoading(false);
  };

  const handleAdvance = async (order: Order) => {
    const next = STATUS_MAP[order.status]?.next;
    if (!next) return;
    await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Pedidos"
        subtitle="Gerencie os pedidos confirmados pelos clientes"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> Novo Pedido
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {["", "PENDING", "CONFIRMED", "IN_PROGRESS", "DELIVERED", "CANCELLED", "LOST"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={statusFilter === s ? { background: "rgba(16,217,160,0.15)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.3)" } : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {s === "" ? "Todos" : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum pedido encontrado</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>+ Criar primeiro pedido</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(filtered as any[]).map((o) => (
              <div key={o.id} className="card p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>{o.number}</span>
                      <p className="font-semibold text-white">{o.title}</p>
                      <Badge className={STATUS_MAP[o.status]?.color}>{STATUS_MAP[o.status]?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1"><Building size={11} /> {o.clientName}</span>
                      {o.project && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: o.project.color }} />{o.project.name}</span>}
                      {o.quote && <span>Orçamento: {o.quote.number}</span>}
                      <span>{formatDate(o.createdAt)}</span>
                    </div>
                    {o.description && <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{o.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {o.total > 0 && <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{formatCurrency(o.total)}</p>}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {STATUS_MAP[o.status]?.next && (
                        <button onClick={() => handleAdvance(o)} title={STATUS_MAP[o.status]?.nextLabel} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium btn-ghost" style={{ color: "#10d9a0" }}>
                          <ArrowRight size={12} /> {STATUS_MAP[o.status]?.nextLabel}
                        </button>
                      )}
                      {ACTIVE_STATUSES.includes(o.status) && (
                        <button
                          title="Oportunidade perdida"
                          className="p-1.5 rounded-lg btn-ghost text-rose-400"
                          onClick={() => { if (confirm("Marcar como Perdido?")) fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "LOST" }) }).then(() => fetchData()); }}
                        >
                          <TrendingDown size={13} />
                        </button>
                      )}
                      {ACTIVE_STATUSES.includes(o.status) && (
                        <button
                          title="Cancelar pedido"
                          className="p-1.5 rounded-lg btn-ghost text-red-400"
                          onClick={() => { if (confirm("Cancelar este pedido?")) fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) }).then(() => fetchData()); }}
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg btn-ghost hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Pedido" size="lg">
        <OrderForm projects={projects} quotes={quotes} onSubmit={handleCreate} loading={formLoading} />
      </Modal>
    </div>
  );
}
