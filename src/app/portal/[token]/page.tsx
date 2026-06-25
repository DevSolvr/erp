import { Code2, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";
import { notFound } from "next/navigation";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PLANNING: { label: "Planejamento", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  IN_PROGRESS: { label: "Em Andamento", color: "#10d9a0", bg: "rgba(16,217,160,0.12)" },
  REVIEW: { label: "Em Revisão", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  COMPLETED: { label: "Concluído", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  ON_HOLD: { label: "Em Espera", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  CANCELLED: { label: "Cancelado", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

async function getPortalData(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/portal/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await getPortalData(token);

  if (!project) notFound();

  const status = STATUS_MAP[project.status] || STATUS_MAP.PLANNING;
  const tech = project.techStack ? project.techStack.split(", ").filter(Boolean) : [];

  return (
    <div className="min-h-screen" style={{ background: "#04040a", color: "#e2e8f0", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#07080d", borderBottom: "1px solid #14181f" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
              <Code2 size={14} color="#000" />
            </div>
            <span className="font-bold text-white text-sm">DevSolvr</span>
            <span className="text-xs ml-1" style={{ color: "#10d9a0", fontFamily: "monospace" }}>Portal do Cliente</span>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="rounded-2xl p-8" style={{ background: "#07080d", border: "1px solid #14181f" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: project.color || "#10d9a0" }} />
            {project.client && (
              <span className="text-sm" style={{ color: "#475569" }}>
                {project.client.company || project.client.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">{project.name}</h1>
          {project.description && (
            <p className="mt-3 text-base leading-relaxed" style={{ color: "#94a3b8" }}>{project.description}</p>
          )}

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <div className="flex gap-6 mt-5 text-sm" style={{ color: "#475569" }}>
              {project.startDate && <span><Clock size={13} className="inline mr-1.5 mb-0.5" />Início: <strong className="text-white">{formatDate(project.startDate)}</strong></span>}
              {project.endDate && <span><Clock size={13} className="inline mr-1.5 mb-0.5" />Previsão: <strong className="text-white">{formatDate(project.endDate)}</strong></span>}
            </div>
          )}

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: "#475569" }}>
              <span>Progresso geral</span>
              <span className="font-bold" style={{ color: "#10d9a0" }}>{project.progress}%</span>
            </div>
            <div style={{ background: "#14181f", borderRadius: 99, overflow: "hidden", height: 8 }}>
              <div style={{ width: `${project.progress}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #10d9a0, #06b6d4)", transition: "width 0.5s ease" }} />
            </div>
          </div>
        </div>

        {/* Task stats + Tech */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "#07080d", border: "1px solid #14181f" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Tarefas</p>
            <div className="space-y-2.5">
              {[
                { label: "Concluídas", value: project.taskStats.done, color: "#10d9a0" },
                { label: "Em andamento", value: project.taskStats.inProgress, color: "#06b6d4" },
                { label: "A fazer", value: project.taskStats.todo, color: "#475569" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {tech.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "#07080d", border: "1px solid #14181f" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Tecnologias</p>
              <div className="flex flex-wrap gap-2">
                {tech.map((t: string) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-md font-mono" style={{ background: "#0d0f14", border: "1px solid #1e2530", color: "#10d9a0" }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Updates timeline */}
        {project.updates?.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={16} style={{ color: "#10d9a0" }} /> Atualizações do Projeto
            </h2>
            <div className="space-y-3">
              {project.updates.map((u: any) => (
                <div key={u.id} className="rounded-xl p-5 relative" style={{ background: "#07080d", border: "1px solid #14181f" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{u.title}</p>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{u.content}</p>
                    </div>
                    <p className="text-xs flex-shrink-0" style={{ color: "#475569" }}>
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(u.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.updates?.length === 0 && (
          <div className="rounded-xl p-10 text-center" style={{ background: "#07080d", border: "1px solid #14181f" }}>
            <p className="text-sm" style={{ color: "#475569" }}>Nenhuma atualização publicada ainda</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs" style={{ color: "#1e2530" }}>
            Desenvolvido por <span style={{ color: "#10d9a0" }}>DevSolvr</span> · Portal exclusivo do cliente
          </p>
        </div>
      </div>
    </div>
  );
}
