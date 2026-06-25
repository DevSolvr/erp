"use client";

import { useEffect, useState } from "react";
import {
  Plus, DollarSign, TrendingUp, TrendingDown, Trash2, Check,
  Clock, AlertCircle, Wrench, Lightbulb, Building, ChevronDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, Project } from "@/types";

// ── constants ────────────────────────────────────────────────────
const SERVICE_SUBTYPES = [
  { value: "CREATION", label: "Criação de Sistema/Site" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "CONSULTING", label: "Consultoria" },
  { value: "OTHER", label: "Outro" },
];

const EXPENSE_CATEGORIES = [
  "Ferramentas & Software",
  "Hospedagem & Infra",
  "Marketing",
  "Equipamento",
  "Pessoal / Freelancer",
  "Treinamento",
  "Outro",
];

const INVESTMENT_CATEGORIES = [
  "Software & Ferramentas",
  "Infraestrutura",
  "Marketing & Branding",
  "Capacitação",
  "Equipamento",
  "Outro",
];

// ── subtype badge helpers ─────────────────────────────────────────
const subtypeLabel: Record<string, string> = {
  CREATION: "Criação", MAINTENANCE: "Manutenção", CONSULTING: "Consultoria", OTHER: "Outro",
  REGULAR: "Despesa", INVESTMENT: "Investimento",
};
const subtypeColor: Record<string, string> = {
  CREATION: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  MAINTENANCE: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  CONSULTING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  OTHER: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  REGULAR: "text-red-400 bg-red-400/10 border-red-400/20",
  INVESTMENT: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

// ── form ─────────────────────────────────────────────────────────
function TransactionForm({ projects, onSubmit, loading }: {
  projects: Project[];
  onSubmit: (d: any) => void;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"INCOME" | "EXPENSE" | "INVESTMENT">("INCOME");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    subtype: "",
    clientName: "",
    reason: "",
    projectId: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    isPaid: false,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      type: tab === "INVESTMENT" ? "EXPENSE" : tab,
      subtype: tab === "INVESTMENT" ? "INVESTMENT" : (tab === "EXPENSE" ? "REGULAR" : form.subtype),
    });
  };

  const categories = tab === "INVESTMENT" ? INVESTMENT_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* type tabs */}
      <div className="flex gap-2 p-1 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
        {(["INCOME", "EXPENSE", "INVESTMENT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-md text-xs font-semibold transition-all"
            style={tab === t ? {
              background: t === "INCOME" ? "rgba(16,217,160,0.15)" : t === "EXPENSE" ? "rgba(239,68,68,0.15)" : "rgba(168,85,247,0.15)",
              color: t === "INCOME" ? "#10d9a0" : t === "EXPENSE" ? "#ef4444" : "#a855f7",
              border: `1px solid ${t === "INCOME" ? "rgba(16,217,160,0.3)" : t === "EXPENSE" ? "rgba(239,68,68,0.3)" : "rgba(168,85,247,0.3)"}`,
            } : { color: "var(--text-muted)" }}
          >
            {t === "INCOME" ? "Receita" : t === "EXPENSE" ? "Despesa" : "Investimento"}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          {tab === "INCOME" ? "Descrição do Serviço *" : tab === "EXPENSE" ? "O que foi gasto *" : "O que está sendo investido *"}
        </label>
        <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.description}
          onChange={(e) => set("description", e.target.value)} placeholder={
            tab === "INCOME" ? "Ex: Desenvolvimento do site ABC" :
            tab === "EXPENSE" ? "Ex: Assinatura Figma" : "Ex: Licença Adobe Creative Cloud"
          } required />
      </div>

      {/* INCOME-specific */}
      {tab === "INCOME" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cliente / Quem vai pagar</label>
              <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Tipo de Serviço</label>
              <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.subtype}
                onChange={(e) => set("subtype", e.target.value)}>
                <option value="">Selecione...</option>
                {SERVICE_SUBTYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data de Vencimento</label>
              <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)} />
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPaid} onChange={(e) => set("isPaid", e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-400" />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Já foi recebido</span>
          </label>
        </>
      )}

      {/* EXPENSE/INVESTMENT-specific */}
      {tab !== "INCOME" && (
        <>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Por quê? {tab === "INVESTMENT" ? "(justificativa do investimento)" : "(motivo da despesa)"}
            </label>
            <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={2}
              value={form.reason} onChange={(e) => set("reason", e.target.value)}
              placeholder={tab === "INVESTMENT" ? "Ex: Melhorar a produtividade da equipe, entregar projetos mais rápido" : "Ex: Necessário para manter os projetos dos clientes no ar"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoria</label>
              <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.category}
                onChange={(e) => set("category", e.target.value)}>
                <option value="">Selecione...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Projeto relacionado</label>
              <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.projectId}
                onChange={(e) => set("projectId", e.target.value)}>
                <option value="">Nenhum</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Valor (R$) *</label>
          <input type="number" step="0.01" min="0" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {tab === "INCOME" ? "Data do Serviço" : "Data"}
          </label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
          {loading ? "Salvando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}

// ── row components ────────────────────────────────────────────────
function IncomeRow({ t, onDelete, onTogglePaid }: { t: any; onDelete: () => void; onTogglePaid: () => void }) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-white/5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: t.isPaid ? "rgba(16,217,160,0.15)" : "rgba(245,158,11,0.15)" }}>
        {t.isPaid
          ? <Check size={15} style={{ color: "#10d9a0" }} />
          : <Clock size={15} style={{ color: "#f59e0b" }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white">{t.description}</p>
          {t.subtype && (
            <Badge className={subtypeColor[t.subtype] || subtypeColor.OTHER}>
              {subtypeLabel[t.subtype] || t.subtype}
            </Badge>
          )}
          <Badge className={t.isPaid ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"}>
            {t.isPaid ? "Recebido" : "A Receber"}
          </Badge>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {t.clientName && (
            <span className="flex items-center gap-1">
              <Building size={11} /> {t.clientName}
            </span>
          )}
          {t.project && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.project.color }} />
              {t.project.name}
            </span>
          )}
          {t.dueDate && (
            <span className={`flex items-center gap-1 ${!t.isPaid && new Date(t.dueDate) < new Date() ? "text-red-400" : ""}`}>
              <Clock size={11} /> Vence: {formatDate(t.dueDate)}
            </span>
          )}
          <span>{formatDate(t.date)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <p className="text-base font-bold" style={{ color: "#10d9a0" }}>+{formatCurrency(t.amount)}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePaid}
            title={t.isPaid ? "Marcar como pendente" : "Marcar como recebido"}
            className="p-1.5 rounded-lg transition-all hover:bg-white/10"
            style={{ color: t.isPaid ? "#f59e0b" : "#10d9a0" }}
          >
            <Check size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg transition-all hover:text-red-400 hover:bg-red-400/10" style={{ color: "var(--text-muted)" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpenseRow({ t, onDelete }: { t: any; onDelete: () => void }) {
  const isInvestment = t.subtype === "INVESTMENT";
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-white/5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: isInvestment ? "rgba(168,85,247,0.15)" : "rgba(239,68,68,0.15)" }}>
        {isInvestment ? <Lightbulb size={15} style={{ color: "#a855f7" }} /> : <Wrench size={15} style={{ color: "#ef4444" }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white">{t.description}</p>
          <Badge className={isInvestment ? subtypeColor.INVESTMENT : subtypeColor.REGULAR}>
            {isInvestment ? "Investimento" : "Despesa"}
          </Badge>
          {t.category && (
            <Badge className="text-slate-400 bg-slate-400/10 border-slate-400/20">{t.category}</Badge>
          )}
        </div>

        {t.reason && (
          <p className="mt-1 text-xs italic" style={{ color: "var(--text-secondary)" }}>
            Por quê: {t.reason}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {t.project && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.project.color }} />
              {t.project.name}
            </span>
          )}
          <span>{formatDate(t.date)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <p className="text-base font-bold text-red-400">-{formatCurrency(t.amount)}</p>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:text-red-400 hover:bg-red-400/10" style={{ color: "var(--text-muted)" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────
type Tab = "income" | "expense" | "investment";

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<Tab>("income");

  const fetchData = () => Promise.all([
    fetch("/api/finance").then((r) => r.json()).then(setTransactions),
    fetch("/api/projects").then((r) => r.json()).then(setProjects),
  ]).finally(() => setLoading(false));

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/finance", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.ok) { setShowCreate(false); fetchData(); }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    await fetch(`/api/finance?id=${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTogglePaid = async (t: Transaction) => {
    const res = await fetch(`/api/finance?id=${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !t.isPaid }),
    });
    if (res.ok) fetchData();
  };

  const income = transactions.filter((t) => t.type === "INCOME");
  const expenses = (transactions as any[]).filter((t) => t.type === "EXPENSE" && t.subtype !== "INVESTMENT");
  const investments = (transactions as any[]).filter((t) => t.type === "EXPENSE" && t.subtype === "INVESTMENT");

  const totalReceived = income.filter((t) => t.isPaid).reduce((s, t) => s + t.amount, 0);
  const totalPending = income.filter((t) => !t.isPaid).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t: any) => s + t.amount, 0);
  const totalInvestments = investments.reduce((s, t: any) => s + t.amount, 0);
  const balance = totalReceived - totalExpenses - totalInvestments;

  const overdueCount = income.filter((t) => !t.isPaid && t.dueDate && new Date(t.dueDate) < new Date()).length;

  const tabList: { key: Tab; label: string; count: number; accent: string }[] = [
    { key: "income", label: "Receitas", count: income.length, accent: "#10d9a0" },
    { key: "expense", label: "Despesas", count: expenses.length, accent: "#ef4444" },
    { key: "investment", label: "Investimentos", count: investments.length, accent: "#a855f7" },
  ];

  const displayList = tab === "income" ? income : tab === "expense" ? expenses : investments;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Financeiro"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={15} /> Registrar
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "A Receber", value: totalPending, icon: Clock, color: "#f59e0b", sub: overdueCount > 0 ? `${overdueCount} vencido${overdueCount > 1 ? "s" : ""}` : undefined, alert: overdueCount > 0 },
            { label: "Recebido", value: totalReceived, icon: TrendingUp, color: "#10d9a0" },
            { label: "Despesas", value: totalExpenses, icon: TrendingDown, color: "#ef4444" },
            { label: "Investimentos", value: totalInvestments, icon: Lightbulb, color: "#a855f7" },
            { label: "Saldo Líquido", value: balance, icon: DollarSign, color: balance >= 0 ? "#10d9a0" : "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: s.color }}>{formatCurrency(s.value)}</p>
              {s.sub && (
                <p className="text-[10px] mt-0.5 font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle size={9} /> {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {tabList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t.key ? {
                background: `${t.accent}18`,
                color: t.accent,
                border: `1px solid ${t.accent}30`,
              } : { color: "var(--text-muted)" }}
            >
              {t.label}
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-elevated)" }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tab === "income" ? "Nenhuma receita registrada" : tab === "expense" ? "Nenhuma despesa registrada" : "Nenhum investimento registrado"}
              </p>
              <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-medium" style={{ color: "var(--accent)" }}>
                + Registrar agora
              </button>
            </div>
          ) : (
            <div>
              {(displayList as any[]).map((t) =>
                tab === "income" ? (
                  <IncomeRow key={t.id} t={t} onDelete={() => handleDelete(t.id)} onTogglePaid={() => handleTogglePaid(t)} />
                ) : (
                  <ExpenseRow key={t.id} t={t} onDelete={() => handleDelete(t.id)} />
                )
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Transação" size="lg">
        <TransactionForm projects={projects} onSubmit={handleCreate} loading={formLoading} />
      </Modal>
    </div>
  );
}
