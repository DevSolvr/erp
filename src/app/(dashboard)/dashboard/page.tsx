"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FolderKanban, CheckSquare, Users, DollarSign, TrendingUp, Clock, AlertCircle, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { cn, PROJECT_STATUS, TASK_STATUS, formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as any)?.role;
  const name = session?.user?.name?.split(" ")[0] || "";

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`Olá, ${name} 👋`}
        subtitle="Aqui está o resumo dos seus projetos"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 rounded mb-4" style={{ background: "var(--bg-elevated)" }} />
                <div className="h-8 rounded w-16" style={{ background: "var(--bg-elevated)" }} />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FolderKanban} label="Total de Projetos" value={stats.projects.total} sub={`${stats.projects.active} em andamento`} color="#10d9a0" />
              <StatCard icon={CheckSquare} label="Tarefas" value={stats.tasks.total} sub={`${stats.tasks.inProgress} em progresso`} color="#06b6d4" />
              {role !== "EXTERNAL" && (
                <StatCard icon={Users} label="Clientes" value={stats.clients.total} color="#10b981" />
              )}
              {role === "ADMIN" && (
                <StatCard icon={DollarSign} label="Saldo" value={formatCurrency(stats.finance.balance)} sub={`Receita: ${formatCurrency(stats.finance.income)}`} color={stats.finance.balance >= 0 ? "#10b981" : "#ef4444"} />
              )}
              {role !== "ADMIN" && (
                <StatCard icon={TrendingUp} label="Concluídas" value={stats.tasks.done} sub="tarefas finalizadas" color="#10b981" />
              )}
              {role === "EXTERNAL" && (
                <StatCard icon={AlertCircle} label="A Fazer" value={stats.tasks.todo} sub="tarefas pendentes" color="#f59e0b" />
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={14} className="text-emerald-400" /> Progresso de Tarefas
              </h3>
              <div className="space-y-3">
                {[
                  { label: "A Fazer", value: stats.tasks.todo, total: stats.tasks.total, color: "#475569" },
                  { label: "Em Andamento", value: stats.tasks.inProgress, total: stats.tasks.total, color: "#06b6d4" },
                  { label: "Concluído", value: stats.tasks.done, total: stats.tasks.total, color: "#10b981" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: item.total ? `${(item.value / item.total) * 100}%` : "0%",
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FolderKanban size={14} className="text-emerald-400" /> Projetos Recentes
                </h3>
                {stats.recentProjects.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>Nenhum projeto ainda</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentProjects.map((project) => (
                      <a key={project.id} href={`/projects/${project.id}`} className="block p-3 rounded-lg transition-colors hover:bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{project.name}</p>
                            {project.client && (
                              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{project.client.name}</p>
                            )}
                          </div>
                          <Badge className={PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.color}>
                            {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]?.label}
                          </Badge>
                        </div>
                        <div className="mt-2 progress-bar h-1">
                          <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{project.progress}% completo</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckSquare size={14} className="text-cyan-400" /> Tarefas Recentes
                </h3>
                {stats.recentTasks.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>Nenhuma tarefa ainda</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: (task.project as any)?.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{task.title}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{(task.project as any)?.name}</p>
                        </div>
                        <Badge className={TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color}>
                          {TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-20" style={{ color: "var(--text-muted)" }}>Erro ao carregar dados</p>
        )}
      </div>
    </div>
  );
}
