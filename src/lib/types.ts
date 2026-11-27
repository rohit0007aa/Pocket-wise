export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Education"
  | "Shopping"
  | "Entertainment"
  | "Hostel and Rent"
  | "Mobile and Internet"
  | "Health"
  | "Other";

export type PaymentMethod =
  | "UPI"
  | "Cash"
  | "Debit Card"
  | "Wallet"
  | "Net Banking";

export interface TeamMember {
  name: string;
  regNo: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  monthlyPocketMoney: number;
  savingsTarget: number;
  onboardingCompleted: boolean;
  teamMembers: TeamMember[];
  createdAt: string;
}

export interface MonthlyBudget {
  id: string;
  monthKey: string; // YYYY-MM
  pocketMoney: number;
  savingsTarget: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  transactionDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  source?: "manual" | "receipt_ai" | "receipt_sample" | "split_bill";
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  monthKey: string;
  category: ExpenseCategory;
  limitAmount: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  category?: string;
  createdAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  note?: string;
  contributedAt: string;
}

export interface SplitParticipant {
  name: string;
  amount: number;
  isCurrentUser?: boolean;
}

export interface SharedBill {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  splitMode: "equal" | "custom";
  participants: SplitParticipant[];
  addedToPersonal: boolean;
  billDate: string;
  createdAt: string;
}

export interface SmartAlert {
  id: string;
  alertKey: string;
  monthKey: string;
  severity: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  dismissed: boolean;
  createdAt: string;
}

export interface ChallengeProgress {
  noSpendDates: string[]; // YYYY-MM-DD
  smartSpendWeekCount: number;
  save500Completed: boolean;
}

export interface AppDataset {
  profile: UserProfile;
  monthlyBudgets: MonthlyBudget[];
  expenses: Expense[];
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  sharedBills: SharedBill[];
  alerts: SmartAlert[];
  challenges: ChallengeProgress;
}
