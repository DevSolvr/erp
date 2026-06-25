"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Printer, FileText, Check, Send, X, XCircle, TrendingDown, Building } from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Quote, Project } from "@/types";

// ── status ────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: "Rascunho",  color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  SENT:     { label: "Enviado",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  APPROVED: { label: "Aprovado",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  REJECTED: { label: "Negado",    color: "text-red-400 bg-red-400/10 border-red-400/20" },
  LOST:     { label: "Perdido",   color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  EXPIRED:  { label: "Expirado",  color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
};

// ── print function (clean white window) ───────────────────────────
function printQuote(quote: any) {
  const items: any[] = quote.items || [];
  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const fmtMoney = (v: number) =>
    "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "";

  const rows = items.map((i) => `
    <tr>
      <td>${i.description}</td>
      <td class="center">${Number(i.quantity).toLocaleString("pt-BR")}</td>
      <td class="right">${fmtMoney(Number(i.unitPrice))}</td>
      <td class="right bold">${fmtMoney(Number(i.quantity) * Number(i.unitPrice))}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento ${quote.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; font-size: 13px; }
    .page { max-width: 760px; margin: 0 auto; padding: 48px 40px; }

    /* header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 3px solid #10d9a0; margin-bottom: 28px; }
    .brand-name { font-size: 20px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #888; font-family: monospace; margin-top: 3px; }
    .doc-label  { font-size: 26px; font-weight: 800; color: #10d9a0; text-align: right; }
    .doc-number { font-size: 13px; color: #555; text-align: right; margin-top: 4px; }
    .doc-date   { font-size: 11px; color: #888; text-align: right; margin-top: 3px; }

    /* client / meta */
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .meta-box { background: #f7f8fa; border-radius: 8px; padding: 14px 16px; border-left: 3px solid #10d9a0; }
    .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #888; font-weight: 600; margin-bottom: 5px; }
    .meta-value { font-size: 14px; font-weight: 700; color: #111; }
    .meta-sub   { font-size: 11px; color: #666; margin-top: 2px; }

    /* title */
    .section-title { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 14px; }

    /* table */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #111; }
    thead th { color: #fff; padding: 10px 14px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #333; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: 600; }

    /* total */
    .total-row { background: #10d9a0 !important; }
    .total-row td { color: #fff !important; font-weight: 700; font-size: 14px; border-bottom: none !important; }

    /* notes */
    .notes { margin-top: 20px; background: #f7f8fa; border-radius: 8px; padding: 14px 16px; }
    .notes-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; margin-bottom: 6px; }
    .notes-text  { font-size: 13px; color: #444; line-height: 1.7; }

    /* validity */
    .validity { margin-top: 20px; display: flex; gap: 24px; font-size: 12px; color: #666; }
    .validity strong { color: #111; }

    /* signatures */
    .signatures { margin-top: 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
    .sig-line { border-top: 1.5px solid #ccc; padding-top: 10px; }
    .sig-name  { font-size: 13px; font-weight: 600; color: #111; }
    .sig-label { font-size: 11px; color: #888; margin-top: 2px; }

    /* footer */
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #bbb; }

    @media print {
      .page { padding: 0; }
      @page { margin: 15mm 18mm; size: A4; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand-name">DevSolvr</div>
      <div class="brand-sub">&gt; Desenvolvimento de Sistemas</div>
    </div>
    <div>
      <div class="doc-label">ORÇAMENTO</div>
      <div class="doc-number">${quote.number}</div>
      <div class="doc-date">Data: ${fmtDate(quote.createdAt)}</div>
      ${quote.validUntil ? `<div class="doc-date">Válido até: <strong>${fmtDate(quote.validUntil)}</strong></div>` : ""}
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">Destinatário</div>
      <div class="meta-value">${quote.clientName}</div>
      ${quote.clientEmail ? `<div class="meta-sub">${quote.clientEmail}</div>` : ""}
    </div>
    ${quote.project ? `<div class="meta-box"><div class="meta-label">Projeto Vinculado</div><div class="meta-value">${quote.project.name}</div></div>` : "<div></div>"}
  </div>

  <div class="section-title">${quote.title}</div>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Descrição do Serviço</th>
        <th class="center" style="width:12%">Qtd</th>
        <th class="right" style="width:19%">Preço Unit.</th>
        <th class="right" style="width:19%">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3"><strong>TOTAL GERAL</strong></td>
        <td class="right"><strong>${fmtMoney(total)}</strong></td>
      </tr>
    </tbody>
  </table>

  ${quote.notes ? `
  <div class="notes">
    <div class="notes-label">Observações e Condições</div>
    <div class="notes-text">${quote.notes.replace(/\n/g, "<br>")}</div>
  </div>` : ""}

  <div class="signatures">
    <div>
      <div class="sig-line"></div>
      <div class="sig-name">${quote.clientName}</div>
      <div class="sig-label">Contratante — Assinatura e data</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-name">DevSolvr</div>
      <div class="sig-label">Contratada — Assinatura e data</div>
    </div>
  </div>

  <div class="footer">
    <span>DevSolvr · Desenvolvimento de Sistemas</span>
    <span>${quote.number} · Documento gerado em ${fmtDate(new Date().toISOString())}</span>
  </div>
</div>
<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes");
  if (win) { win.document.write(html); win.document.close(); }
}

// ── quote form ────────────────────────────────────────────────────
function QuoteForm({ projects, onSubmit, loading }: { projects: Project[]; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ title: "", clientName: "", clientEmail: "", projectId: "", notes: "", validUntil: "" });
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (i: number, k: string, v: any) => setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem  = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, items }); }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título do Orçamento *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Desenvolvimento Site Institucional" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome do Cliente *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Ex: João Silva / Empresa ABC" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email do Cliente</label>
          <input type="email" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} placeholder="cliente@email.com" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Projeto Vinculado</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Válido até</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Itens do Orçamento</label>
          <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 font-medium" style={{ color: "var(--accent)" }}>
            <Plus size={12} /> Adicionar item
          </button>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            <span className="col-span-6">Descrição</span>
            <span className="col-span-2 text-center">Qtd</span>
            <span className="col-span-2 text-right">Preço Unit.</span>
            <span className="col-span-2 text-right">Subtotal</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="col-span-6">
                <input className="input-field w-full px-2 py-1.5 rounded-lg text-xs" value={item.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="Descrição do serviço" required />
              </div>
              <div className="col-span-2">
                <input type="number" min="0.5" step="0.5" className="input-field w-full px-2 py-1.5 rounded-lg text-xs text-center" value={item.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
              </div>
              <div className="col-span-2">
                <input type="number" min="0" step="0.01" className="input-field w-full px-2 py-1.5 rounded-lg text-xs text-right" value={item.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} />
              </div>
              <div className="col-span-1 text-right text-xs font-medium text-white">
                {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-1 rounded hover:text-red-400 transition-colors" style={{ color: "var(--text-muted)" }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end px-3 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>Total: {formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Observações / Condições</label>
        <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Condições de pagamento, prazo de entrega, forma de pagamento..." />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
          {loading ? "Criando..." : "Criar Orçamento"}
        </button>
      </div>
    </form>
  );
}

// ── page ─────────────────────────────────────────────────────────
export default function QuotesPage() {
  const [quotes, setQuotes]   = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = () => Promise.all([
    fetch("/api/quotes").then((r) => r.json()).then(setQuotes),
    fetch("/api/projects").then((r) => r.json()).then(setProjects),
  ]).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowCreate(false); fetchData(); }
    setFormLoading(false);
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const filtered = statusFilter ? quotes.filter((q) => q.status === statusFilter) : quotes;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Orçamentos"
        subtitle="Crie e gerencie orçamentos para seus clientes"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> Novo Orçamento
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["", "DRAFT", "SENT", "APPROVED", "REJECTED", "LOST", "EXPIRED"] as const).map((s) => (
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
            <FileText size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum orçamento encontrado</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>+ Criar primeiro orçamento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {(filtered as any[]).map((q) => (
              <div key={q.id} className="card p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>{q.number}</span>
                      <p className="font-semibold text-white">{q.title}</p>
                      <Badge className={STATUS_MAP[q.status]?.color}>{STATUS_MAP[q.status]?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1"><Building size={11} /> {q.clientName}</span>
                      {q.project && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: q.project.color }} />{q.project.name}
                        </span>
                      )}
                      {q.validUntil && <span>Válido até {formatDate(q.validUntil)}</span>}
                      <span>{q.items?.length || 0} {q.items?.length === 1 ? "item" : "itens"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{formatCurrency(q.total)}</p>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => printQuote(q)}
                        title="Imprimir / Salvar PDF"
                        className="p-1.5 rounded-lg btn-ghost flex items-center gap-1.5 text-xs font-medium px-2.5"
                        style={{ color: "var(--accent)" }}
                      >
                        <Printer size={13} /> PDF
                      </button>
                      {q.status === "DRAFT" && (
                        <button onClick={() => handleStatus(q.id, "SENT")} title="Marcar como Enviado" className="p-1.5 rounded-lg btn-ghost text-blue-400">
                          <Send size={13} />
                        </button>
                      )}
                      {(q.status === "SENT" || q.status === "DRAFT") && (
                        <button onClick={() => handleStatus(q.id, "APPROVED")} title="Aprovado" className="p-1.5 rounded-lg btn-ghost text-emerald-400">
                          <Check size={13} />
                        </button>
                      )}
                      {(q.status === "SENT" || q.status === "DRAFT") && (
                        <button onClick={() => { if (confirm("Marcar como Negado?")) handleStatus(q.id, "REJECTED"); }} title="Negado pelo cliente" className="p-1.5 rounded-lg btn-ghost text-red-400">
                          <XCircle size={13} />
                        </button>
                      )}
                      {(q.status === "SENT" || q.status === "DRAFT") && (
                        <button onClick={() => { if (confirm("Marcar como Perdido?")) handleStatus(q.id, "LOST"); }} title="Oportunidade perdida" className="p-1.5 rounded-lg btn-ghost text-rose-400">
                          <TrendingDown size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg btn-ghost hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Orçamento" size="xl">
        <QuoteForm projects={projects} onSubmit={handleCreate} loading={formLoading} />
      </Modal>
    </div>
  );
}
