"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Filter, FolderKanban, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn, PROJECT_STATUS, PRIORITY, formatDate, formatCurrency, PROJECT_COLORS } from "@/lib/utils";
import type { Project, Client } from "@/types";

const STATUSES = ["", "PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TECH_SUGGESTIONS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "Vue.js", "Laravel", "Flutter", "React Native", "PostgreSQL", "MongoDB", "Tailwind CSS"];

function ProjectForm({ initial, clients, onSubmit, loading }: {
  initial?: Partial<Project>;
  clients: Client[];
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    status: initial?.status || "PLANNING",
    priority: initial?.priority || "MEDIUM",
    startDate: initial?.startDate ? initial.startDate.slice(0, 10) : "",
    endDate: initial?.endDate ? initial.endDate.slice(0, 10) : "",
    budget: initial?.budget || "",
    progress: initial?.progress ?? 0,
    techStack: initial?.techStack || "",
    color: initial?.color || PROJECT_COLORS[0],
    clientId: initial?.clientId || "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome do Projeto *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Site Institucional ABC" required />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Descrição</label>
          <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Descreva o projeto..." />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS[s as keyof typeof PROJECT_STATUS]?.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Prioridade</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY[p as keyof typeof PRIORITY]?.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data Início</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data Entrega</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Orçamento (R$)</label>
          <input type="number" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0,00" min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Progresso ({form.progress}%)</label>
          <input type="range" min="0" max="100" className="w-full accent-emerald-500 mt-2" value={form.progress} onChange={(e) => set("progress", Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Tecnologias</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.techStack} onChange={(e) => set("techStack", e.target.value)} placeholder="React, Node.js, PostgreSQL..." />
          <div className="flex flex-wrap gap-1 mt-2">
            {TECH_SUGGESTIONS.map((t) => (
              <button key={t} type="button" onClick={() => { const curr = form.techStack ? form.techStack.split(", ").filter(Boolean) : []; if (!curr.includes(t)) set("techStack", [...curr, t].join(", ")); }}
                className="text-xs px-2 py-0.5 rounded border transition-colors" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {clients.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cliente</label>
            <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
              <option value="">Sem cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cor</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {PROJECT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set("color", c)}
                className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: form.color === c ? "white" : "transparent" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
          {loading ? "Salvando..." : initial?.id ? "Atualizar" : "Criar Projeto"}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const canEdit = role === "ADMIN" || role === "COLLABORATOR";

  const fetchProjects = () => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (statusFilter) q.set("status", statusFilter);
    fetch(`/api/projects?${q}`).then((r) => r.json()).then(setProjects).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);
  useEffect(() => { if (canEdit) fetch("/api/clients").then((r) => r.json()).then(setClients); }, [canEdit]);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowCreate(false); fetchProjects(); }
    setFormLoading(false);
  };

  const handleEdit = async (data: any) => {
    if (!editProject) return;
    setFormLoading(true);
    const res = await fetch(`/api/projects/${editProject.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setEditProject(null); fetchProjects(); }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Projetos" subtitle={`${projects.length} projeto(s)`} actions={
        canEdit ? (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Novo Projeto
          </button>
        ) : undefined
      } />

      <div className="p-6 flex gap-3 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input-field w-full pl-9 pr-3 py-2 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar projetos..." />
        </div>
        <select className="input-field px-3 py-2 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{PROJECT_STATUS[s as keyof typeof PROJECT_STATUS]?.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card p-5 h-48 animate-pulse" style={{ background: "var(--bg-elevated)" }} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FolderKanban size={40} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Nenhum projeto encontrado</p>
            {canEdit && <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 rounded-lg text-sm">Criar primeiro projeto</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card p-5 flex flex-col gap-3 group hover:border-emerald-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
                    <h3 className="font-semibold text-white truncate">{project.name}</h3>
                  </div>
                  <Badge className={PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.color}>
                    {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.label}
                  </Badge>
                </div>

                {project.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{project.description}</p>
                )}

                {project.techStack && (
                  <div className="flex flex-wrap gap-1">
                    {project.techStack.split(", ").slice(0, 4).map((t) => (
                      <span key={t} className="terminal-tag px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>{t}</span>
                    ))}
                    {project.techStack.split(", ").length > 4 && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{project.techStack.split(", ").length - 4}</span>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-muted)" }}>Progresso</span>
                    <span className="text-white">{project.progress}%</span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="flex items-center gap-3">
                    {project.client && <span>{project.client.name}</span>}
                    {project._count && <span>{project._count.tasks} tarefas</span>}
                    {project.budget && <span>{formatCurrency(project.budget)}</span>}
                  </div>
                  {project.endDate && <span>até {formatDate(project.endDate)}</span>}
                </div>

                <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <a href={`/projects/${project.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors hover:text-white" style={{ color: "var(--text-muted)" }}>
                    <ExternalLink size={12} /> Ver Detalhes
                  </a>
                  {canEdit && (
                    <>
                      <button onClick={() => setEditProject(project)} className="flex-1 py-1.5 rounded-lg text-xs transition-colors hover:text-emerald-400 hover:bg-emerald-400/10" style={{ color: "var(--text-muted)" }}>
                        Editar
                      </button>
                      {role === "ADMIN" && (
                        <button onClick={() => handleDelete(project.id)} className="flex-1 py-1.5 rounded-lg text-xs transition-colors hover:text-red-400 hover:bg-red-400/10" style={{ color: "var(--text-muted)" }}>
                          Excluir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto" size="lg">
        <ProjectForm clients={clients} onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <Modal open={!!editProject} onClose={() => setEditProject(null)} title="Editar Projeto" size="lg">
        {editProject && <ProjectForm initial={editProject} clients={clients} onSubmit={handleEdit} loading={formLoading} />}
      </Modal>
    </div>
  );
}
