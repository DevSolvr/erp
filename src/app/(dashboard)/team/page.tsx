"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Mail, Shield, UserCheck, UserX, Edit2, Trash2, Key } from "lucide-react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn, getInitials, ROLE, formatDate } from "@/lib/utils";
import type { User, Project } from "@/types";

const ROLES = ["ADMIN", "COLLABORATOR", "EXTERNAL"];

function UserForm({ initial, projects, onSubmit, loading }: {
  initial?: Partial<User & { projectIds?: string[] }>; projects: Project[];
  onSubmit: (d: any) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    password: "",
    userRole: initial?.role || "COLLABORATOR",
    projectIds: initial?.projectIds || [] as string[],
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleProject = (pid: string) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(pid) ? f.projectIds.filter((p) => p !== pid) : [...f.projectIds, pid],
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email *</label>
          <input type="email" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.email} onChange={(e) => set("email", e.target.value)} required={!initial?.id} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            {initial?.id ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
          </label>
          <input type="password" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.password} onChange={(e) => set("password", e.target.value)} required={!initial?.id} placeholder={initial?.id ? "••••••••" : ""} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Função</label>
          <select className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.userRole} onChange={(e) => set("userRole", e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE[r as keyof typeof ROLE]?.label}</option>)}
          </select>
        </div>
      </div>

      {form.userRole === "EXTERNAL" && projects.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Acesso aos Projetos</label>
          <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            {projects.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5">
                <input type="checkbox" checked={form.projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} className="accent-emerald-500" />
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-sm text-white">{p.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Terceiros só veem os projetos que você liberar</p>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
          {loading ? "Salvando..." : initial?.id ? "Atualizar" : "Criar Usuário"}
        </button>
      </div>
    </form>
  );
}

export default function TeamPage() {
  const { data: session } = useSession();
  const currentId = (session?.user as any)?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const fetchUsers = () => fetch("/api/users").then((r) => r.json()).then(setUsers).finally(() => setLoading(false));
  useEffect(() => {
    fetchUsers();
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowCreate(false); fetchUsers(); }
    else { const err = await res.json(); alert(err.error || "Erro ao criar usuário"); }
    setFormLoading(false);
  };

  const handleEdit = async (data: any) => {
    if (!editUser) return;
    setFormLoading(true);
    const res = await fetch(`/api/users/${editUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, projectIds: data.userRole === "EXTERNAL" ? data.projectIds : undefined }) });
    if (res.ok) { setEditUser(null); fetchUsers(); }
    setFormLoading(false);
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/users/${user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !user.active }) });
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este usuário?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const roleGroups = ROLES.map((r) => ({ role: r, users: users.filter((u) => u.role === r) })).filter((g) => g.users.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Equipe" subtitle={`${users.length} membro(s)`} actions={
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Usuário
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" style={{ background: "var(--bg-elevated)" }} />)}</div>
        ) : (
          roleGroups.map(({ role, users: group }) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: "var(--text-muted)" }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {ROLE[role as keyof typeof ROLE]?.label} ({group.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {group.map((user) => (
                  <div key={user.id} className={cn("card p-4 transition-all hover:border-emerald-500/20", !user.active && "opacity-50")}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white truncate text-sm">{user.name}</p>
                          {user.id === currentId && <span className="text-[10px] text-emerald-400">(você)</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail size={10} style={{ color: "var(--text-muted)" }} />
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                        </div>
                      </div>
                      <Badge className={ROLE[user.role as keyof typeof ROLE]?.color}>
                        {ROLE[user.role as keyof typeof ROLE]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                      <span>Desde {formatDate(user.createdAt)}</span>
                      <span className={cn("flex items-center gap-1", user.active ? "text-green-400" : "text-red-400")}>
                        {user.active ? <><UserCheck size={11} /> Ativo</> : <><UserX size={11} /> Inativo</>}
                      </span>
                    </div>
                    {user.id !== currentId && (
                      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                        <button onClick={() => setEditUser(user)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors hover:text-emerald-400 hover:bg-emerald-400/10" style={{ color: "var(--text-muted)" }}>
                          <Edit2 size={11} /> Editar
                        </button>
                        <button onClick={() => handleToggleActive(user)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors hover:text-yellow-400 hover:bg-yellow-400/10" style={{ color: "var(--text-muted)" }}>
                          {user.active ? <><UserX size={11} /> Desativar</> : <><UserCheck size={11} /> Ativar</>}
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors hover:text-red-400 hover:bg-red-400/10" style={{ color: "var(--text-muted)" }}>
                          <Trash2 size={11} /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Users size={40} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Nenhum membro na equipe</p>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Usuário" size="md">
        <UserForm projects={projects} onSubmit={handleCreate} loading={formLoading} />
      </Modal>
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuário" size="md">
        {editUser && <UserForm initial={editUser} projects={projects} onSubmit={handleEdit} loading={formLoading} />}
      </Modal>
    </div>
  );
}
