export type Role = "ADMIN" | "COLLABORATOR" | "EXTERNAL";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TransactionType = "INCOME" | "EXPENSE";
export type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "DELIVERED" | "CANCELLED";
export type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spent: number | null;
  progress: number;
  techStack: string | null;
  color: string;
  clientId: string | null;
  createdAt: string;
  client?: Client | null;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  project?: Project;
  assignee?: User | null;
  _count?: { comments: number };
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  subtype: string | null;
  clientName: string | null;
  reason: string | null;
  projectId: string | null;
  category: string | null;
  date: string;
  dueDate: string | null;
  isPaid: boolean;
  project?: Project | null;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  quoteId: string;
}

export interface Quote {
  id: string;
  number: string;
  title: string;
  clientName: string;
  clientEmail: string | null;
  projectId: string | null;
  status: QuoteStatus;
  notes: string | null;
  validUntil: string | null;
  total: number;
  createdAt: string;
  project?: Project | null;
  items?: QuoteItem[];
  orders?: Order[];
}

export interface Order {
  id: string;
  number: string;
  title: string;
  clientName: string;
  projectId: string | null;
  quoteId: string | null;
  status: OrderStatus;
  description: string | null;
  total: number;
  createdAt: string;
  project?: Project | null;
  quote?: Quote | null;
}

export interface Contract {
  id: string;
  number: string;
  title: string;
  clientName: string;
  projectId: string | null;
  quoteId: string | null;
  orderId: string | null;
  status: ContractStatus;
  value: number;
  startDate: string | null;
  endDate: string | null;
  content: string | null;
  createdAt: string;
  project?: Project | null;
  quote?: Quote | null;
  order?: Order | null;
}

export interface TimelineEvent {
  id: string;
  type: "project" | "task" | "finance" | "quote" | "order" | "contract";
  title: string;
  subtitle?: string;
  date: string;
  status?: string;
  color?: string;
  link?: string;
}

export interface DashboardStats {
  projects: { total: number; active: number; completed: number };
  tasks: { total: number; todo: number; inProgress: number; done: number };
  clients: { total: number };
  finance: { income: number; expense: number; balance: number };
  recentProjects: Project[];
  recentTasks: Task[];
}
