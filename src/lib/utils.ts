import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PROJECT_STATUS = {
  PLANNING: { label: "Planejamento", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  IN_PROGRESS: { label: "Em Andamento", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  REVIEW: { label: "Em Revisão", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  COMPLETED: { label: "Concluído", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  ON_HOLD: { label: "Em Espera", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  CANCELLED: { label: "Cancelado", color: "text-red-400 bg-red-400/10 border-red-400/20" },
} as const;

export const TASK_STATUS = {
  TODO: { label: "A Fazer", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  IN_PROGRESS: { label: "Em Andamento", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  REVIEW: { label: "Em Revisão", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  DONE: { label: "Concluído", color: "text-green-400 bg-green-400/10 border-green-400/20" },
} as const;

export const PRIORITY = {
  LOW: { label: "Baixa", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  MEDIUM: { label: "Média", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  HIGH: { label: "Alta", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  URGENT: { label: "Urgente", color: "text-red-400 bg-red-400/10 border-red-400/20" },
} as const;

export const ROLE = {
  ADMIN: { label: "Admin", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  COLLABORATOR: { label: "Funcionário", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  EXTERNAL: { label: "Terceiro", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
} as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const PROJECT_COLORS = [
  "#7c3aed", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6",
];
