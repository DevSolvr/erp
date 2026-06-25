"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, Mail, Phone, Globe, Trash2, Edit2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import { getInitials } from "@/lib/utils";
import type { Client } from "@/types";

function ClientForm({ initial, onSubmit, loading }: { initial?: Partial<Client>; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: initial?.name || "", email: initial?.email || "", phone: initial?.phone || "", company: initial?.company || "", website: initial?.website || "", notes: initial?.notes || "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nome *</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Telefone</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Empresa</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Website</label>
          <input className="input-field w-full px-3 py-2 rounded-lg text-sm" value={form.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Notas</label>
          <textarea className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2 rounded-lg text-sm font-medium">
          {loading ? "Salvando..." : initial?.id ? "Atualizar" : "Criar Cliente"}
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const fetchClients = () => fetch("/api/clients").then((r) => r.json()).then(setClients).finally(() => setLoading(false));
  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setShowCreate(false); fetchClients(); }
    setFormLoading(false);
  };

  const handleEdit = async (data: any) => {
    if (!editClient) return;
    setFormLoading(true);
    const res = await fetch(`/api/clients/${editClient.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setEditClient(null); fetchClients(); }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Clientes" subtitle={`${clients.length} cliente(s)`} actions={
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Cliente
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card p-5 h-40 animate-pulse" style={{ background: "var(--bg-elevated)" }} />)}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Briefcase size={40} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Nenhum cliente cadastrado</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 rounded-lg text-sm">Adicionar cliente</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client.id} className="card p-5 hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #10d9a0, #06b6d4)" }}>
                    {getInitials(client.company || client.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{client.name}</p>
                    {client.company && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{client.company}</p>}
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {(client._count as any)?.projects || 0} proj.
                  </span>
                </div>
                <div className="space-y-1.5 mb-4">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
                      <Mail size={12} /> {client.email}
                    </a>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Phone size={12} /> {client.phone}
                    </div>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs hover:text-cyan-400 transition-colors" style={{ color: "var(--text-muted)" }}>
                      <Globe size={12} /> {client.website}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button onClick={() => setEditClient(client)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors hover:text-emerald-400 hover:bg-emerald-400/10" style={{ color: "var(--text-muted)" }}>
                    <Edit2 size={11} /> Editar
                  </button>
                  {role === "ADMIN" && (
                    <button onClick={() => handleDelete(client.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors hover:text-red-400 hover:bg-red-400/10" style={{ color: "var(--text-muted)" }}>
                      <Trash2 size={11} /> Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Cliente" size="md">
        <ClientForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar Cliente" size="md">
        {editClient && <ClientForm initial={editClient} onSubmit={handleEdit} loading={formLoading} />}
      </Modal>
    </div>
  );
}
