import { getCurrentMonthKey } from "./finance";
import type { AppDataset } from "./types";

function clampDay(monthKey: string, targetDay: number, maxDay: number): string {
  const d = Math.max(1, Math.min(targetDay, maxDay));
  return `${monthKey}-${String(d).padStart(2, "0")}`;
}

function getPreviousMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  let y = Number(yStr);
  let m = Number(mStr) - 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function createDemoDataset(now = new Date()): AppDataset {
  const currentMonth = getCurrentMonthKey(now);
  const prevMonth = getPreviousMonthKey(currentMonth);
  const maxDay = Math.max(1, now.getDate());
  const d = (fraction: number) =>
    clampDay(currentMonth, Math.round(1 + (maxDay - 1) * fraction), maxDay);

  return {
    profile: {
      id: "demo-student",
      fullName: "Aarav Sharma (Demo)",
      email: "demo.student@pocketwise.edu",
      monthlyPocketMoney: 5000,
      savingsTarget: 1000,
      onboardingCompleted: true,
      teamMembers: [
        { name: "Team Member 1", regNo: "JU/BT/CSE/2026/001" },
        { name: "Team Member 2", regNo: "JU/BT/CSE/2026/002" },
      ],
      createdAt: now.toISOString(),
    },
    monthlyBudgets: [
      {
        id: "demo-mb-current",
        monthKey: currentMonth,
        pocketMoney: 5000,
        savingsTarget: 1000,
      },
      {
        id: "demo-mb-prev",
        monthKey: prevMonth,
        pocketMoney: 5000,
        savingsTarget: 1000,
      },
    ],
    categoryBudgets: [
      { id: "cb-1", monthKey: currentMonth, category: "Food", limitAmount: 1800 },
      { id: "cb-2", monthKey: currentMonth, category: "Transport", limitAmount: 700 },
      { id: "cb-3", monthKey: currentMonth, category: "Shopping", limitAmount: 750 },
      { id: "cb-4", monthKey: currentMonth, category: "Entertainment", limitAmount: 600 },
      { id: "cb-5", monthKey: currentMonth, category: "Education", limitAmount: 600 },
    ],
    expenses: [
      // Current Month: exact sum = ₹3,800
      // Food = 1500
      {
        id: "demo-exp-1",
        title: "Hostel Tiffin & Mess Add-on",
        amount: 420,
        category: "Food",
        transactionDate: d(0.05),
        paymentMethod: "UPI",
        notes: "Monthly extra meal pass",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-2",
        title: "JECRC Campus Canteen & Coffee",
        amount: 340,
        category: "Food",
        transactionDate: d(0.28),
        paymentMethod: "UPI",
        notes: "Lunch & cold coffee with lab partners",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-3",
        title: "Sitapura Dhaba Dinner",
        amount: 290,
        category: "Food",
        transactionDate: d(0.55),
        paymentMethod: "Cash",
        notes: "Post-hackathon dinner",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-4",
        title: "Evening Chai & Snacks",
        amount: 260,
        category: "Food",
        transactionDate: d(0.75),
        paymentMethod: "UPI",
        notes: "Samosa, chai & fruit juice",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-5",
        title: "Midnight Maggi & Groceries",
        amount: 190,
        category: "Food",
        transactionDate: d(0.95),
        paymentMethod: "UPI",
        notes: "Exam prep snacks",
        source: "manual",
        createdAt: now.toISOString(),
      },

      // Transport = 600
      {
        id: "demo-exp-6",
        title: "Jaipur Metro Smart Card",
        amount: 250,
        category: "Transport",
        transactionDate: d(0.12),
        paymentMethod: "Wallet",
        notes: "Monthly metro recharge",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-7",
        title: "Auto & E-Rickshaw Rides",
        amount: 210,
        category: "Transport",
        transactionDate: d(0.48),
        paymentMethod: "Cash",
        notes: "Campus to Sitapura & Tonk Road",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-8",
        title: "Weekend Bus Pass",
        amount: 140,
        category: "Transport",
        transactionDate: d(0.82),
        paymentMethod: "UPI",
        notes: "City commute",
        source: "manual",
        createdAt: now.toISOString(),
      },

      // Shopping = 800
      {
        id: "demo-exp-9",
        title: "Casual Hoodie & Socks",
        amount: 520,
        category: "Shopping",
        transactionDate: d(0.36),
        paymentMethod: "Debit Card",
        notes: "Winter campus wear",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-10",
        title: "USB-C Cable & Laptop Stand Pad",
        amount: 280,
        category: "Shopping",
        transactionDate: d(0.68),
        paymentMethod: "UPI",
        notes: "Desk accessories",
        source: "manual",
        createdAt: now.toISOString(),
      },

      // Entertainment = 500
      {
        id: "demo-exp-11",
        title: "Weekend Movie Ticket & Popcorn",
        amount: 320,
        category: "Entertainment",
        transactionDate: d(0.42),
        paymentMethod: "UPI",
        notes: "WTP Jaipur student discount",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-12",
        title: "Music & Cloud Student Plan",
        amount: 180,
        category: "Entertainment",
        transactionDate: d(0.18),
        paymentMethod: "Debit Card",
        notes: "Monthly student subscription",
        source: "manual",
        createdAt: now.toISOString(),
      },

      // Education = 400
      {
        id: "demo-exp-13",
        title: "DSA Lab Printouts & Spiral Binding",
        amount: 240,
        category: "Education",
        transactionDate: d(0.22),
        paymentMethod: "Cash",
        notes: "Semester practical file",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-exp-14",
        title: "Python & AI Reference Booklet",
        amount: 160,
        category: "Education",
        transactionDate: d(0.62),
        paymentMethod: "UPI",
        notes: "Digital Data & AI Literacy notes",
        source: "manual",
        createdAt: now.toISOString(),
      },

      // Previous month sample expenses for multi-month comparison chart
      {
        id: "demo-prev-1",
        title: "Previous Month Food & Mess",
        amount: 1750,
        category: "Food",
        transactionDate: `${prevMonth}-08`,
        paymentMethod: "UPI",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-prev-2",
        title: "Previous Month Commute",
        amount: 680,
        category: "Transport",
        transactionDate: `${prevMonth}-14`,
        paymentMethod: "Cash",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-prev-3",
        title: "Previous Month Shopping & Tech",
        amount: 1120,
        category: "Shopping",
        transactionDate: `${prevMonth}-19`,
        paymentMethod: "Debit Card",
        source: "manual",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-prev-4",
        title: "Previous Month Textbooks",
        amount: 650,
        category: "Education",
        transactionDate: `${prevMonth}-24`,
        paymentMethod: "UPI",
        source: "manual",
        createdAt: now.toISOString(),
      },
    ],
    savingsGoals: [
      {
        id: "demo-goal-1",
        title: "Emergency Student Fund",
        targetAmount: 3000,
        savedAmount: 1450,
        deadline: `${currentMonth.slice(0, 4)}-12-31`,
        category: "Emergency",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-goal-2",
        title: "Noise-Cancelling Study Headphones",
        targetAmount: 2500,
        savedAmount: 900,
        deadline: `${currentMonth.slice(0, 4)}-12-31`,
        category: "Tech",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-goal-3",
        title: "Jaipur–Udaipur College Trip",
        targetAmount: 4000,
        savedAmount: 1200,
        deadline: `${currentMonth.slice(0, 4)}-12-31`,
        category: "Travel",
        createdAt: now.toISOString(),
      },
    ],
    savingsContributions: [
      {
        id: "demo-contrib-1",
        goalId: "demo-goal-1",
        amount: 500,
        note: "Saved from pocket money allowance",
        contributedAt: `${currentMonth}-02T10:00:00.000Z`,
      },
      {
        id: "demo-contrib-2",
        goalId: "demo-goal-2",
        amount: 200,
        note: "Skipped weekend food delivery",
        contributedAt: `${currentMonth}-05T16:30:00.000Z`,
      },
    ],
    sharedBills: [
      {
        id: "demo-split-1",
        title: "Hostel Pizza & Cold Drinks",
        totalAmount: 720,
        paidBy: "Aarav (You)",
        splitMode: "equal",
        participants: [
          { name: "Aarav (You)", amount: 240, isCurrentUser: true },
          { name: "Rohan", amount: 240 },
          { name: "Kabir", amount: 240 },
        ],
        addedToPersonal: false,
        billDate: d(0.5),
        createdAt: now.toISOString(),
      },
    ],
    alerts: [],
    challenges: {
      noSpendDates: [d(0.15), d(0.45)],
      smartSpendWeekCount: 4,
      save500Completed: false,
    },
  };
}
