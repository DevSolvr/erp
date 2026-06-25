"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, ChevronRight, CalendarDays, FolderKanban,
  CheckSquare, DollarSign, FileText, ClipboardList, ScrollText,
  AlertCircle, Plus, Bell, Users, Globe, Lock, User, Trash2, X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/ui/Modal";
import type { TimelineEvent } from "@/types";
import Link from "next/link";

// ── event configs ─────────────────────────────────────────────────
const TYPE_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  project:        { label: "Projeto",        color: "#10d9a0", bg: "rgba(16,217,160,0.15)", icon: FolderKanban },
  project_end:    { label: "Prazo Projeto",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: FolderKanban },
  task:           { label: "Tarefa",         color: "#06b6d4", bg: "rgba(6,182,212,0.15)",  icon: CheckSquare },
  finance:        { label: "Financeiro",     color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: DollarSign },
  quote:          { label: "Orçamento",      color: "#a855f7", bg: "rgba(168,85,247,0.15)", icon: FileText },
  order:          { label: "Pedido",         color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: ClipboardList },
  contract:       { label: "Contrato",       color: "#10d9a0", bg: "rgba(16,217,160,0.15)", icon: ScrollText },
  contract_end:   { label: "Fim Contrato",   color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: ScrollText },
  // notices
  notice_all:      { label: "Aviso Geral",        color: "#10d9a0", bg: "rgba(16,217,160,0.15)", icon: Bell },
  notice_employees:{ label: "Para Funcionários",   color: "#3b82f6", bg: "rgba(59,130,246,0.15)", icon: Users },
  notice_external: { label: "Para Terceiros",      color: "#a855f7", bg: "rgba(168,85,247,0.15)", icon: Globe },
  notice_personal: { label: "Pessoal (só você)",   color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: Lock },
};

const VISIBILITY_OPTIONS = [
  { value: "ALL",       label: "Todos",               icon: Globe,  color: "#10d9a0", desc: "Admin, funcionários e terceiros" },
  { value: "EMPLOYEES", label: "Apenas Funcionários", icon: Users,  color: "#3b82f6", desc: "Acesso a todos os projetos" },
  { value: "EXTERNAL",  label: "Apenas Terceiros",    icon: User,   color: "#a855f7", desc: "Quem ajuda em projetos pontuais" },
  { value: "PERSONAL",  label: "Pessoal",             icon: Lock,   color: "#f59e0b", desc: "Só você (admin) vê" },
];

// ── calendar helpers ──────────────────────────────────────────────
const DAYS_PT   = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function EventDot({ color }: { color: string }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function EventCard({ event, isAdmin, onDelete }: {
  event: TimelineEvent & { noticeId?: string };
  isAdmin: boolean;
  onDelete?: (id: string) => void;
}) {
  const cfg  = TYPE_CFG[event.type] || TYPE_CFG.task;
  const Icon = cfg.icon;
  const isOverdue = new Date(event.date) < new Date() && event.type === "task";

  const inner = (
    <div className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 group">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-snug truncate">{event.title}</p>
        {event.subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{event.subtitle}</p>
        )}
        <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block font-medium"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
        {isOverdue && (
          <span className="ml-2 text-[10px] text-red-400 flex items-center gap-0.5 inline-flex">
            <AlertCircle size={9} /> Atrasado
          </span>
        )}
      </div>
      {isAdmin && event.noticeId && onDelete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(event.noticeId!); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );

  return event.link ? <Link href={event.link}>{inner}</Link> : inner;
}

// ── notice form ────────────────────────────────────────────────────
function NoticeForm({ defaultDate, onSubmit, loading, onClose }: {
  defaultDate: string; onSubmit: (d: any) => void; loading: boolean; onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", date: defaultDate, endDate: "", visibility: "ALL", color: "#10d9a0",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const selectedVis = VISIBILITY_OPTIONS.find((v) => v.value === form.visibility)!;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-5">
      {/* Visibility selector */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Quem pode ver este aviso?</label>
        <div className="grid grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const sel = form.visibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("visibility", opt.value)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={sel
                  ? { background: `${opt.color}18`, border: `1px solid ${opt.color}50` }
                  : { background: "var(--bg-elevated)", border: "1px solid var(--border)" }
                }
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: sel ? `${opt.color}25` : "var(--bg-surface)" }}>
                  <Icon size={14} style={{ color: sel ? opt.color : "var(--text-muted)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: sel ? opt.color : "var(--text-secondary)" }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Título *</label>
        <input
          className="input-field w-full px-3 py-2 rounded-lg text-sm"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ex: Reunião de equipe, Feriado, Entrega..."
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Descrição</label>
        <textarea
          className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Detalhes adicionais..."
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Data *</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.date} onChange={(e) => set("date", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Até (opcional)</label>
          <input type="date" className="input-field w-full px-3 py-2 rounded-lg text-sm"
            value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
            min={form.date} />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Cor do evento</label>
        <div className="flex gap-2">
          {["#10d9a0","#06b6d4","#3b82f6","#a855f7","#f59e0b","#ef4444","#ec4899","#64748b"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                background: c,
                outline: form.color === c ? `3px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-1">
        <button type="button" onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-sm">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold">
          {loading ? "Salvando..." : "Criar Aviso"}
        </button>
      </div>
    </form>
  );
}

// ── main page ─────────────────────────────────────────────────────
export default function AgendaPage() {
  const { data: session } = useSession();
  const role    = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [notices,        setNotices]        = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [addLoading,     setAddLoading]     = useState(false);

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(toDateKey(today));

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/timeline").then((r) => r.json()),
      fetch("/api/agenda-events").then((r) => r.json()),
    ]).then(([tl, ag]) => {
      setTimelineEvents(Array.isArray(tl) ? tl : []);
      setNotices(Array.isArray(ag) ? ag : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // Convert notices to TimelineEvent format
  const noticeEvents: (TimelineEvent & { noticeId: string })[] = useMemo(() =>
    notices.map((n) => ({
      id: `notice-${n.id}`,
      noticeId: n.id,
      type: `notice_${n.visibility.toLowerCase()}` as any,
      title: n.title,
      subtitle: n.description || undefined,
      date: n.date,
      color: n.color,
    })), [notices]);

  // Merge all events
  const allEvents = useMemo(() => [...timelineEvents, ...noticeEvents], [timelineEvents, noticeEvents]);

  // Group by date key
  const byDate = useMemo(() => {
    const map: Record<string, (TimelineEvent & { noticeId?: string })[]> = {};
    allEvents.forEach((e) => {
      // Slice the ISO string directly to avoid UTC→local timezone shift (e.g. UTC-3 Brasil)
      const key = (e.date as string).slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e as any);
    });
    return map;
  }, [allEvents]);

  const grid         = buildGrid(viewYear, viewMonth);
  const todayKey     = toDateKey(today);
  const selectedEvts = byDate[selected] || [];

  // Sort selected events: notices first, then by type
  const sortedSelected = useMemo(() => [
    ...selectedEvts.filter((e) => e.type?.startsWith("notice_")),
    ...selectedEvts.filter((e) => !e.type?.startsWith("notice_")),
  ], [selectedEvts]);

  const prevMonth = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };
  const goToday   = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelected(todayKey); };

  const handleCreateNotice = async (data: any) => {
    setAddLoading(true);
    await fetch("/api/agenda-events", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    setShowAdd(false);
    fetchAll();
    setAddLoading(false);
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Excluir este aviso?")) return;
    await fetch(`/api/agenda-events?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  const selectedDate = new Date(selected + "T12:00:00");

  const totalThisMonth = grid.reduce((acc, d) => {
    if (!d) return acc;
    return acc + (byDate[toDateKey(d)]?.length || 0);
  }, 0);

  const upcomingDates = Object.entries(byDate)
    .filter(([key]) => key > toDateKey(today))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 8);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Agenda"
        subtitle="Calendário de eventos e avisos"
        actions={isAdmin ? (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Plus size={15} /> Novo Aviso
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-hidden flex">
        {/* ── calendar ── */}
        <div className="flex flex-col flex-shrink-0" style={{ width: 380, borderRight: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-base font-bold text-white">{MONTHS_PT[viewMonth]} {viewYear}</p>
              {totalThisMonth > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {totalThisMonth} evento{totalThisMonth !== 1 ? "s" : ""} este mês
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToday} className="px-2.5 py-1 rounded-lg text-xs font-medium btn-ghost mr-1">Hoje</button>
              <button onClick={prevMonth} className="p-1.5 rounded-lg btn-ghost"><ChevronLeft size={15} /></button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg btn-ghost"><ChevronRight size={15} /></button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS_PT.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider py-1" style={{ color: "var(--text-muted)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-0.5 flex-1 content-start">
            {grid.map((date, idx) => {
              if (!date) return <div key={idx} />;
              const key   = toDateKey(date);
              const evts  = byDate[key] || [];
              const isToday = key === todayKey;
              const isSel   = key === selected;
              const hasNotice = evts.some((e: any) => e.type?.startsWith("notice_"));

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className="relative flex flex-col items-center py-1.5 rounded-xl transition-all"
                  style={isSel
                    ? { background: "rgba(16,217,160,0.15)", border: "1px solid rgba(16,217,160,0.35)" }
                    : hasNotice
                    ? { background: "rgba(16,217,160,0.05)", border: "1px solid rgba(16,217,160,0.15)" }
                    : { border: "1px solid transparent" }
                  }
                >
                  <span
                    className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                    style={isToday
                      ? { background: "#10d9a0", color: "#000", fontWeight: 700 }
                      : { color: isSel ? "#10d9a0" : "var(--text-secondary)" }
                    }
                  >
                    {date.getDate()}
                  </span>
                  {evts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[36px]">
                      {evts.slice(0, 4).map((e: any, i: number) => (
                        <EventDot key={i} color={(TYPE_CFG[e.type] || TYPE_CFG.task).color} />
                      ))}
                      {evts.length > 4 && (
                        <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>+{evts.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Visibilidade dos Avisos
            </p>
            <div className="space-y-1">
              {VISIBILITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Icon size={11} style={{ color: opt.color }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{opt.label}</span>
                    <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>— {opt.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── day panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day header */}
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white capitalize">
                  {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  {selected === todayKey && (
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(16,217,160,0.15)", color: "#10d9a0" }}>
                      Hoje
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {sortedSelected.length === 0 ? "Nenhum evento" : `${sortedSelected.length} evento${sortedSelected.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium btn-ghost"
                  style={{ color: "var(--accent)" }}
                >
                  <Plus size={13} /> Aviso neste dia
                </button>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
              ))}</div>
            ) : sortedSelected.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-16">
                <CalendarDays size={40} className="mb-4 opacity-20" />
                <p className="text-sm font-medium text-white mb-1">Dia livre</p>
                <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                  Nenhum evento para este dia. Clique em <strong style={{ color: "var(--accent)" }}>+ Aviso</strong> para criar um.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Divider if has notices */}
                {sortedSelected.some((e: any) => e.type?.startsWith("notice_")) && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bell size={11} style={{ color: "var(--accent)" }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Avisos</p>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                )}
                {sortedSelected.filter((e: any) => e.type?.startsWith("notice_")).map((e: any) => (
                  <EventCard key={e.id} event={e} isAdmin={isAdmin} onDelete={handleDeleteNotice} />
                ))}
                {sortedSelected.some((e: any) => !e.type?.startsWith("notice_")) && (
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <CalendarDays size={11} style={{ color: "var(--text-muted)" }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Eventos do Sistema</p>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                )}
                {sortedSelected.filter((e: any) => !e.type?.startsWith("notice_")).map((e: any) => (
                  <EventCard key={e.id} event={e} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming strip */}
          {!loading && (
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Próximos eventos
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {upcomingDates.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Nenhum evento futuro agendado</p>
                ) : upcomingDates.map(([key, evts]) => {
                  const d = new Date(key + "T12:00:00");
                  return (
                    <button key={key}
                      onClick={() => { setSelected(key); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
                      className="flex-shrink-0 rounded-xl px-3 py-2.5 text-center transition-all"
                      style={{
                        background: key === selected ? "rgba(16,217,160,0.12)" : "var(--bg-elevated)",
                        border: key === selected ? "1px solid rgba(16,217,160,0.3)" : "1px solid var(--border)",
                        minWidth: 64,
                      }}
                    >
                      <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                        {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-lg font-bold text-white leading-none mt-0.5">{d.getDate()}</p>
                      <div className="flex gap-0.5 justify-center mt-1.5">
                        {(evts as any[]).slice(0, 3).map((e, i) => (
                          <EventDot key={i} color={(TYPE_CFG[e.type] || TYPE_CFG.task).color} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create notice modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novo Aviso na Agenda" size="lg">
        <NoticeForm
          defaultDate={selected}
          onSubmit={handleCreateNotice}
          loading={addLoading}
          onClose={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}
