"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Printer, ScrollText, Building, Edit2, Check, Send } from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contract, Project, Quote, Order } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Rascunho",   color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  SENT:      { label: "Enviado",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  SIGNED:    { label: "Assinado",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  ACTIVE:    { label: "Em Vigor",   color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  COMPLETED: { label: "Concluído",  color: "text-green-400 bg-green-400/10 border-green-400/20" },
  CANCELLED: { label: "Cancelado",  color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

// ── print contract ────────────────────────────────────────────────
function printContract(contract: any) {
  const fmtDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "___/___/______";
  const fmtMoney = (v: number) =>
    "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const content = (contract.content || "")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato ${contract.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Georgia, serif; color: #111; background: #fff; font-size: 13px; line-height: 1.8; }
    .page { max-width: 720px; margin: 0 auto; padding: 56px 48px; }
    .header { text-align: center; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #10d9a0; }
    .brand { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; }
    .doc-title { font-size: 20px; font-weight: 700; color: #111; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .doc-number { font-size: 13px; color: #10d9a0; margin-top: 4px; font-family: monospace; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .meta-item { background: #f8f9fa; padding: 12px 14px; border-radius: 6px; border-left: 3px solid #10d9a0; font-family: Arial, sans-serif; }
    .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; }
    .meta-val { font-size: 13px; font-weight: 600; color: #111; margin-top: 3px; }
    .content { white-space: pre-wrap; font-size: 13px; color: #222; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 10px; color: #aaa; }
    @media print {
      .page { padding: 0; }
      @page { margin: 18mm 20mm; size: A4; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">DevSolvr · Desenvolvimento de Sistemas</div>
    <div class="doc-title">Contrato de Prestação de Serviços</div>
    <div class="doc-number">${contract.number}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Contratante</div>
      <div class="meta-val">${contract.clientName}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Valor</div>
      <div class="meta-val">${fmtMoney(contract.value || 0)}</div>
    </div>
    ${contract.startDate ? `<div class="meta-item"><div class="meta-label">Início</div><div class="meta-val">${fmtDate(contract.startDate)}</div></div>` : ""}
    ${contract.endDate ? `<div class="meta-item"><div class="meta-label">Término</div><div class="meta-val">${fmtDate(contract.endDate)}</div></div>` : ""}
  </div>

  <div class="content">${content}</div>

  <div class="footer">
    <span>DevSolvr · Desenvolvimento de Sistemas</span>
    <span>${contract.number} · Emitido em ${fmtDate(new Date().toISOString())}</span>
  </div>
</div>
<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes");
  if (win) { win.document.write(html); win.document.close(); }
}

// ── form ──────────────────────────────────────────────────────────
function ContractForm({ projects, quotes, orders, onSubmit, loading }: {
  projects: Project[]; quotes: Quote[]; orders: Order[]; onSubmit: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    title: "", clientName: "", projectId: "", quoteId: "", orderId: "",
    value: "", startDate: "", endDate: "", content: "",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleQuoteChange = (quoteId: string) => {
    const q = quotes.find((q) => q.id === quoteId);
    setForm((f) => ({
      ...f,
      quoteId,
      ...(q ? {
        clientName: q.clientName,
        value: String(q.total),
        title: q.title,
        ...(q.projectId ? { projectId: q.projectId } : {}),
      } : {}),
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título do Contrato *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.title}
            onChange={(e) => set("title", e.target.value)} placeholder="Ex: Contrato de Desenvolvimento — Site ABC" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cliente (Contratante) *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)} placeholder="Nome / Empresa" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Valor (R$)</label>
          <input type="number" step="0.01" min="0" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Início</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Término</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Vincular Orçamento</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.quoteId}
            onChange={(e) => handleQuoteChange(e.target.value)}>
            <option value="">Sem orçamento</option>
            {quotes.map((q) => <option key={q.id} value={q.id}>{q.number} — {q.clientName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Vincular Pedido</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.orderId}
            onChange={(e) => set("orderId", e.target.value)}>
            <option value="">Sem pedido</option>
            {orders.map((o) => <option key={o.id} value={o.id}>{o.number} — {o.clientName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Projeto</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.projectId}
            onChange={(e) => set("projectId", e.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Conteúdo do Contrato
          <span className="ml-2 font-normal" style={{ color: "var(--text-muted)" }}>(gerado automaticamente se deixado em branco)</span>
        </label>
        <textarea className="input-field w-full px-3 py-2 rounded-lg text-xs font-mono resize-none" rows={8}
          value={form.content} onChange={(e) => set("content", e.target.value)}
          placeholder="Deixe em branco para usar o modelo padrão..." />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
          {loading ? "Criando..." : "Criar Contrato"}
        </button>
      </div>
    </form>
  );
}

// ── page ─────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [quotes,    setQuotes]    = useState<Quote[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing,    setEditing]    = useState<Contract | null>(null);
  const [editContent, setEditContent] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = () => Promise.all([
    fetch("/api/contracts").then((r) => r.json()).then(setContracts),
    fetch("/api/projects").then((r) => r.json()).then(setProjects),
    fetch("/api/quotes").then((r) => r.json()).then(setQuotes),
    fetch("/api/orders").then((r) => r.json()).then(setOrders),
  ]).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.ok) { setShowCreate(false); fetchData(); }
    setFormLoading(false);
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleSaveContent = async () => {
    if (!editing) return;
    await fetch(`/api/contracts/${editing.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editContent }),
    });
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este contrato?")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = statusFilter ? contracts.filter((c) => c.status === statusFilter) : contracts;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Contratos"
        subtitle="Gerencie contratos de prestação de serviços"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> Novo Contrato
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(["", "DRAFT", "SENT", "SIGNED", "ACTIVE", "COMPLETED"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={statusFilter === s
                ? { background: "rgba(16,217,160,0.15)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.3)" }
                : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {s === "" ? "Todos" : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <ScrollText size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum contrato encontrado</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>+ Criar primeiro contrato</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(filtered as any[]).map((c) => (
              <div key={c.id} className="card p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>{c.number}</span>
                      <p className="font-semibold text-white">{c.title}</p>
                      <Badge className={STATUS_MAP[c.status]?.color}>{STATUS_MAP[c.status]?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1"><Building size={11} /> {c.clientName}</span>
                      {c.project && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.project.color }} />{c.project.name}</span>}
                      {c.startDate && <span>Início: {formatDate(c.startDate)}</span>}
                      {c.endDate && <span>Término: {formatDate(c.endDate)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {c.value > 0 && <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{formatCurrency(c.value)}</p>}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(c); setEditContent(c.content || ""); }} title="Editar texto" className="p-1.5 rounded-lg btn-ghost"><Edit2 size={13} /></button>
                      <button
                        onClick={() => printContract(c)}
                        title="Imprimir / Salvar PDF"
                        className="p-1.5 rounded-lg btn-ghost flex items-center gap-1.5 text-xs font-medium px-2.5"
                        style={{ color: "var(--accent)" }}
                      >
                        <Printer size={13} /> PDF
                      </button>
                      {c.status === "DRAFT" && <button onClick={() => handleStatus(c.id, "SENT")} title="Marcar como Enviado" className="p-1.5 rounded-lg btn-ghost text-blue-400"><Send size={13} /></button>}
                      {c.status === "SENT" && <button onClick={() => handleStatus(c.id, "SIGNED")} title="Marcar como Assinado" className="p-1.5 rounded-lg btn-ghost text-emerald-400"><Check size={13} /></button>}
                      {c.status === "SIGNED" && <button onClick={() => handleStatus(c.id, "ACTIVE")} title="Ativar" className="p-1.5 rounded-lg btn-ghost text-cyan-400"><Check size={13} /></button>}
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg btn-ghost hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Contrato" size="xl">
        <ContractForm projects={projects} quotes={quotes} orders={orders} onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Editar — ${editing?.number}`} size="xl">
        <div className="space-y-4">
          <textarea
            className="input-field w-full px-3 py-2 rounded-lg text-xs font-mono resize-none"
            rows={18}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex justify-between">
            <button onClick={() => editing && printContract({ ...editing, content: editContent })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm btn-ghost" style={{ color: "var(--accent)" }}>
              <Printer size={14} /> Imprimir / PDF
            </button>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost px-4 py-2 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleSaveContent} className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
