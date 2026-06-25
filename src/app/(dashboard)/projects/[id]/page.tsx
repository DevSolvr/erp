"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Plus, CheckSquare, Users, Calendar, DollarSign, Trash2,
  Key, Eye, EyeOff, Copy, Check, Globe, GlobeLock, MessageSquare,
  Lock, ExternalLink, Zap, Server, Database, Code2,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn, PROJECT_STATUS, TASK_STATUS, PRIORITY, formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { Project, Task, User } from "@/types";

// ── constants ─────────────────────────────────────────────────────
const TASK_COLS: { status: string; label: string; color: string }[] = [
  { status: "TODO", label: "A Fazer", color: "#475569" },
  { status: "IN_PROGRESS", label: "Em Andamento", color: "#06b6d4" },
  { status: "REVIEW", label: "Em Revisão", color: "#f59e0b" },
  { status: "DONE", label: "Concluído", color: "#10b981" },
];

const SECRET_CATEGORIES = [
  { value: "DATABASE", label: "Banco de Dados", icon: Database },
  { value: "API", label: "API / Chaves", icon: Key },
  { value: "HOSTING", label: "Hospedagem", icon: Server },
  { value: "ENV", label: ".ENV / Config", icon: Code2 },
  { value: "OTHER", label: "Outros", icon: Lock },
];

type Tab = "tasks" | "credentials" | "portal";

// ── Task form ──────────────────────────────────────────────────────
function TaskForm({ initial, projectId, users, onSubmit, loading }: {
  initial?: Partial<Task>; projectId: string; users: User[];
  onSubmit: (data: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "", description: initial?.description || "",
    status: initial?.status || "TODO", priority: initial?.priority || "MEDIUM",
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : "",
    assigneeId: initial?.assigneeId || "",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, projectId }); }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título *</label>
        <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Descrição</label>
        <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {TASK_COLS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Prioridade</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data Limite</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Responsável</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
            <option value="">Sem responsável</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
          {loading ? "Salvando..." : initial?.id ? "Atualizar" : "Criar Tarefa"}
        </button>
      </div>
    </form>
  );
}

// ── Credentials tab ────────────────────────────────────────────────
function CredentialsTab({ projectId }: { projectId: string }) {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", value: "", category: "OTHER", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchSecrets = () => fetch(`/api/projects/${projectId}/secrets`)
    .then((r) => r.json()).then(setSecrets).finally(() => setLoading(false));

  useEffect(() => { fetchSecrets(); }, [projectId]);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyValue = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/projects/${projectId}/secrets`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setShowCreate(false);
    setForm({ label: "", value: "", category: "OTHER", notes: "" });
    fetchSecrets();
    setSaving(false);
  };

  const handleDelete = async (secretId: string) => {
    if (!confirm("Excluir esta credencial?")) return;
    await fetch(`/api/projects/${projectId}/secrets?secretId=${secretId}`, { method: "DELETE" });
    fetchSecrets();
  };

  const grouped = SECRET_CATEGORIES.map((cat) => ({
    ...cat,
    items: secrets.filter((s) => s.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Credenciais & Senhas</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Visível apenas para Admin e Funcionários
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-12 animate-pulse" />)}</div>
      ) : secrets.length === 0 ? (
        <div className="card p-10 text-center">
          <Key size={28} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma credencial ainda</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Adicione senhas, chaves de API, dados do banco, etc.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-xs font-medium" style={{ color: "var(--accent)" }}>+ Adicionar primeira credencial</button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{group.label}</p>
                </div>
                <div className="card overflow-hidden">
                  {group.items.map((secret, i) => (
                    <div key={secret.id} className="flex items-center gap-4 px-4 py-3 group"
                      style={i > 0 ? { borderTop: "1px solid var(--border)" } : {}}>
                      <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 items-center">
                        <div>
                          <p className="text-xs font-mono font-semibold text-white">{secret.label}</p>
                          {secret.notes && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{secret.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono flex-1 min-w-0 truncate" style={{ color: revealed.has(secret.id) ? "var(--accent)" : "var(--text-muted)" }}>
                            {revealed.has(secret.id) ? secret.value : "•".repeat(Math.min(secret.value.length, 20))}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleReveal(secret.id)} className="p-1.5 rounded-lg btn-ghost" title={revealed.has(secret.id) ? "Ocultar" : "Revelar"}>
                          {revealed.has(secret.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => copyValue(secret.id, secret.value)} className="p-1.5 rounded-lg btn-ghost" title="Copiar">
                          {copied === secret.id ? <Check size={12} style={{ color: "var(--accent)" }} /> : <Copy size={12} />}
                        </button>
                        <button onClick={() => handleDelete(secret.id)} className="p-1.5 rounded-lg btn-ghost hover:text-red-400" title="Excluir">
                          <Trash2 size={12} />
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Credencial" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome / Label *</label>
              <input className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono" value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="DB_PASSWORD" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoria</label>
              <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {SECRET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Valor / Senha *</label>
              <input className="input-field w-full px-3 py-2 rounded-lg text-sm font-mono" value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="Valor da credencial" required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Observação</label>
              <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Contexto adicional (opcional)" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Portal tab ─────────────────────────────────────────────────────
function PortalTab({ projectId, initialEnabled, initialToken }: { projectId: string; initialEnabled: boolean; initialToken: string | null }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [token, setToken] = useState(initialToken);
  const [saving, setSaving] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPublic: true });
  const [addLoading, setAddLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUpdates = () => fetch(`/api/projects/${projectId}/updates`).then((r) => r.json()).then(setUpdates);
  useEffect(() => { fetchUpdates(); }, [projectId]);

  const portalUrl = token ? `${window.location.origin}/portal/${token}` : null;

  const toggle = async (action: "enable" | "disable" | "regenerate") => {
    setSaving(true);
    const res = await fetch(`/api/projects/${projectId}/portal`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setEnabled(data.portalEnabled);
      setToken(data.portalToken);
    }
    setSaving(false);
  };

  const copyLink = () => {
    if (portalUrl) { navigator.clipboard.writeText(portalUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    await fetch(`/api/projects/${projectId}/updates`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ title: "", content: "", isPublic: true });
    fetchUpdates();
    setAddLoading(false);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    await fetch(`/api/projects/${projectId}/updates?updateId=${updateId}`, { method: "DELETE" });
    fetchUpdates();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Portal control */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enabled ? <Globe size={20} style={{ color: "var(--accent)" }} /> : <GlobeLock size={20} style={{ color: "var(--text-muted)" }} />}
            <div>
              <h3 className="text-sm font-semibold text-white">Portal do Cliente</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {enabled ? "Link ativo — o cliente pode visualizar este projeto" : "Portal desativado"}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggle(enabled ? "disable" : "enable")}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={enabled
              ? { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
              : { background: "rgba(16,217,160,0.15)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.3)" }
            }
          >
            {saving ? "..." : enabled ? "Desativar Portal" : "Ativar Portal"}
          </button>
        </div>

        {enabled && portalUrl && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Link do Cliente</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono overflow-hidden"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                <span className="truncate">{portalUrl}</span>
              </div>
              <button onClick={copyLink} title="Copiar link" className="p-2.5 rounded-xl btn-ghost flex-shrink-0">
                {copied ? <Check size={14} style={{ color: "var(--accent)" }} /> : <Copy size={14} />}
              </button>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl btn-ghost flex-shrink-0">
                <ExternalLink size={14} />
              </a>
            </div>
            <button onClick={() => toggle("regenerate")} className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Gerar novo link (invalida o anterior)
            </button>
          </div>
        )}
      </div>

      {/* Updates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare size={14} style={{ color: "var(--accent)" }} /> Observações & Atualizações
          </h3>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {updates.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma atualização ainda</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>As atualizações públicas ficam visíveis no portal do cliente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="card p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{u.title}</p>
                      {u.isPublic
                        ? <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(16,217,160,0.12)", color: "#10d9a0", border: "1px solid rgba(16,217,160,0.2)" }}>Público</span>
                        : <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>Interno</span>}
                    </div>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{u.content}</p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</p>
                  </div>
                  <button onClick={() => handleDeleteUpdate(u.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg btn-ghost hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nova Atualização" size="md">
        <form onSubmit={handleAddUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título *</label>
            <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Entrega do layout, Correção de bugs..." required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Conteúdo *</label>
            <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={4}
              value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Descreva o que foi feito, o status atual, próximos passos..." required />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded accent-emerald-400" />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Visível no portal do cliente</span>
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={addLoading} className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold">
              {addLoading ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [project, setProject] = useState<any>(null);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState("TODO");
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  const canEdit = role === "ADMIN" || role === "COLLABORATOR";

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [id]);
  useEffect(() => { if (role === "ADMIN") fetch("/api/users").then((r) => r.json()).then(setTeamUsers); }, [role]);

  const handleCreateTask = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowTaskModal(false); fetchProject(); }
    setFormLoading(false);
  };

  const handleEditTask = async (data: any) => {
    if (!editTask) return;
    setFormLoading(true);
    const res = await fetch(`/api/tasks/${editTask.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setEditTask(null); fetchProject(); }
    setFormLoading(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchProject();
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = project.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;
    await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...task, status: newStatus }) });
    fetchProject();
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="Carregando..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col h-full">
      <Header title="Projeto não encontrado" />
      <div className="flex-1 flex items-center justify-center">
        <Link href="/projects" className="btn-ghost px-4 py-2 rounded-lg text-sm">Voltar</Link>
      </div>
    </div>
  );

  const tasksByStatus = (status: string) => project.tasks.filter((t: Task) => t.status === status);

  const tabs = [
    { key: "tasks" as Tab, label: "Tarefas", count: project.tasks?.length },
    ...(canEdit ? [
      { key: "credentials" as Tab, label: "Credenciais", icon: Key },
      { key: "portal" as Tab, label: "Portal do Cliente", icon: Globe },
    ] : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={project.name}
        subtitle={project.client?.name}
        actions={
          <div className="flex items-center gap-3">
            <Badge className={PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.color}>
              {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.label}
            </Badge>
            {canEdit && activeTab === "tasks" && (
              <button onClick={() => { setNewTaskStatus("TODO"); setShowTaskModal(true); }}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={14} /> Nova Tarefa
              </button>
            )}
          </div>
        }
      />

      {/* Info bar */}
      <div className="px-6 py-3 border-b flex items-center gap-6 flex-wrap" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <Link href="/projects" className="flex items-center gap-1.5 text-sm hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={14} /> Projetos
        </Link>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
          <span className="text-white font-medium">{project.name}</span>
        </div>
        {project.endDate && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <Calendar size={12} /> {formatDate(project.endDate)}
          </div>
        )}
        {project.budget && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <DollarSign size={12} /> {formatCurrency(project.budget)}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="progress-bar h-1.5 w-24">
            <div className="progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{project.progress}%</span>
        </div>
        {project.techStack && (
          <div className="flex gap-1 flex-wrap">
            {project.techStack.split(", ").map((t: string) => (
              <span key={t} className="terminal-tag px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all -mb-px"
            style={activeTab === tab.key
              ? { background: "var(--bg-base)", borderTop: "1px solid var(--border)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--bg-base)", color: "white" }
              : { color: "var(--text-muted)" }}
          >
            {tab.icon && <tab.icon size={13} />}
            {tab.label}
            {"count" in tab && tab.count !== undefined && (
              <span className="text-xs px-1.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "tasks" && (
          <>
            <div className="p-6 flex gap-4 overflow-x-auto">
              {TASK_COLS.map((col) => {
                const colTasks = tasksByStatus(col.status);
                return (
                  <div key={col.status} className="flex-shrink-0 w-72">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        <span className="text-sm font-semibold text-white">{col.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{colTasks.length}</span>
                      </div>
                      {canEdit && (
                        <button onClick={() => { setNewTaskStatus(col.status); setShowTaskModal(true); }}
                          className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {colTasks.map((task: any) => (
                        <div key={task.id} className="card p-3 cursor-pointer hover:border-emerald-500/30"
                          onClick={() => canEdit && setEditTask(task)}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                            <Badge className={cn("flex-shrink-0", PRIORITY[task.priority as keyof typeof PRIORITY]?.color)}>
                              {PRIORITY[task.priority as keyof typeof PRIORITY]?.label}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>{task.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {task.assignee && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
                                  style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }} title={task.assignee.name}>
                                  {getInitials(task.assignee.name)}
                                </div>
                              )}
                              {task.dueDate && (
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  <Calendar size={9} className="inline mr-0.5" />{formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            {canEdit && (
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                  className="text-[10px] px-1 py-0.5 rounded"
                                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                  {TASK_COLS.map((c) => <option key={c.status} value={c.status}>{c.label}</option>)}
                                </select>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-0.5 rounded hover:text-red-400" style={{ color: "var(--text-muted)" }}>
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="text-center py-6 text-xs rounded-lg border border-dashed"
                          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                          Sem tarefas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {project.projectAccess?.length > 0 && (
              <div className="px-6 pb-6">
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} className="text-emerald-400" /> Equipe no Projeto
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {project.projectAccess.map((pa: any) => (
                      <div key={pa.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
                          style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
                          {getInitials(pa.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{pa.user.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pa.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "credentials" && canEdit && (
          <CredentialsTab projectId={id} />
        )}

        {activeTab === "portal" && canEdit && (
          <PortalTab
            projectId={id}
            initialEnabled={project.portalEnabled || false}
            initialToken={project.portalToken || null}
          />
        )}
      </div>

      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nova Tarefa" size="md">
        <TaskForm projectId={id} users={teamUsers} onSubmit={handleCreateTask} loading={formLoading} initial={{ status: newTaskStatus as any }} />
      </Modal>

      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Editar Tarefa" size="md">
        {editTask && <TaskForm initial={editTask} projectId={id} users={teamUsers} onSubmit={handleEditTask} loading={formLoading} />}
      </Modal>
    </div>
  );
}
