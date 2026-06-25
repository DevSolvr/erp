"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, DollarSign,
  Settings, LogOut, Code2, Briefcase, CalendarDays,
  FileText, ClipboardList, ScrollText, ShieldCheck,
} from "lucide-react";
import { cn, getInitials, ROLE } from "@/lib/utils";

type NavItem = { href: string; icon: any; label: string; roles: string[] };
type Section = { label: string | null; items: NavItem[] };

const sections: Section[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "COLLABORATOR", "EXTERNAL"] },
      { href: "/projects", icon: FolderKanban, label: "Projetos", roles: ["ADMIN", "COLLABORATOR", "EXTERNAL"] },
      { href: "/tasks", icon: CheckSquare, label: "Tarefas", roles: ["ADMIN", "COLLABORATOR", "EXTERNAL"] },
      { href: "/clients", icon: Briefcase, label: "Clientes", roles: ["ADMIN", "COLLABORATOR"] },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/timeline", icon: CalendarDays, label: "Agenda", roles: ["ADMIN", "COLLABORATOR"] },
      { href: "/quotes", icon: FileText, label: "Orçamentos", roles: ["ADMIN", "COLLABORATOR"] },
      { href: "/orders", icon: ClipboardList, label: "Pedidos", roles: ["ADMIN", "COLLABORATOR"] },
      { href: "/contracts", icon: ScrollText, label: "Contratos", roles: ["ADMIN", "COLLABORATOR"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/team", icon: Users, label: "Equipe", roles: ["ADMIN"] },
      { href: "/finance", icon: DollarSign, label: "Financeiro", roles: ["ADMIN"] },
      { href: "/vault", icon: ShieldCheck, label: "Cofre", roles: ["ADMIN"] },
      { href: "/settings", icon: Settings, label: "Configurações", roles: ["ADMIN", "COLLABORATOR", "EXTERNAL"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "EXTERNAL";
  const name = session?.user?.name || "";

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}>
            <Code2 size={14} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">DevSolvr</p>
            <p className="terminal-tag mt-0.5 text-[10px]">&gt; ERP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {sections.map((section, si) => {
          const filtered = section.items.filter((item) => item.roles.includes(role));
          if (filtered.length === 0) return null;
          return (
            <div key={si}>
              {section.label && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {filtered.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                        active ? "text-white font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                      style={active ? { background: "rgba(16,217,160,0.1)", borderLeft: "2px solid #10d9a0" } : {}}
                    >
                      <item.icon size={15} style={active ? { color: "#10d9a0" } : {}} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10d9a0, #0ba87c)" }}
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{name}</p>
            <span className={cn("text-[9px] font-medium border rounded px-1", ROLE[role as keyof typeof ROLE]?.color)}>
              {ROLE[role as keyof typeof ROLE]?.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={12} />
          Sair
        </button>
      </div>
    </aside>
  );
}
