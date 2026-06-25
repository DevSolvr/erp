"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckSquare, Calendar, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { cn, TASK_STATUS, PRIORITY, formatDate, getInitials } from "@/lib/utils";
import type { Task } from "@/types";

const STATUS_KEYS = Object.keys(TASK_STATUS) as Array<keyof typeof TASK_STATUS>;

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"list" | "board">("list");

  useEffect(() => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/tasks${q}`).then((r) => r.json()).then(setTasks).finally(() => setLoading(false));
  }, [statusFilter]);

  const tasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Tarefas" subtitle={`${tasks.length} tarefa(s) no total`} actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["list", "board"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", view === v ? "text-white" : "text-slate-500")} style={view === v ? { background: "var(--bg-elevated)" } : {}}>
                {v === "list" ? "Lista" : "Board"}
              </button>
            ))}
          </div>
          <select className="input-field px-3 py-1.5 rounded-lg text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_KEYS.map((s) => <option key={s} value={s}>{TASK_STATUS[s].label}</option>)}
          </select>
        </div>
      } />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-16 animate-pulse" style={{ background: "var(--bg-elevated)" }} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <CheckSquare size={40} style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>Nenhuma tarefa encontrada</p>
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {tasks.map((task: any) => (
              <div key={task.id} className="card p-4 flex items-center gap-4 hover:border-emerald-500/20 transition-all">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.project?.color || "#10d9a0" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    {task.project?.name} {task.description ? "— " + task.description : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Calendar size={11} /> {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.assignee && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }} title={task.assignee.name}>
                      {getInitials(task.assignee.name)}
                    </div>
                  )}
                  <Badge className={PRIORITY[task.priority as keyof typeof PRIORITY]?.color}>
                    {PRIORITY[task.priority as keyof typeof PRIORITY]?.label}
                  </Badge>
                  <Badge className={TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color}>
                    {TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_KEYS.map((status) => {
              const col = TASK_STATUS[status];
              const colTasks = tasksByStatus(status);
              return (
                <div key={status} className="flex-shrink-0 w-64">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task: any) => (
                      <div key={task.id} className="card p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: task.project?.color }} />
                          <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{task.project?.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={PRIORITY[task.priority as keyof typeof PRIORITY]?.color}>
                            {PRIORITY[task.priority as keyof typeof PRIORITY]?.label}
                          </Badge>
                          {task.assignee && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
                              {getInitials(task.assignee.name)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-center py-4 text-xs rounded-lg border border-dashed" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>Vazia</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
