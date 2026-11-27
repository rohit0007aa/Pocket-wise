import type { ExpenseCategory, PaymentMethod } from "./types";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Entertainment",
  "Hostel and Rent",
  "Mobile and Internet",
  "Health",
  "Other",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Cash",
  "Debit Card",
  "Wallet",
  "Net Banking",
];

export const ESSENTIAL_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Education",
  "Hostel and Rent",
  "Mobile and Internet",
  "Health",
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: "#40E8A1",
  Transport: "#D5FA72",
  Education: "#38BDF8",
  Shopping: "#F472B6",
  Entertainment: "#A78BFA",
  "Hostel and Rent": "#FB923C",
  "Mobile and Internet": "#2DD4BF",
  Health: "#F87171",
  Other: "#91A99B",
};

export const ACADEMIC_PROJECT_INFO = {
  project: "PocketWise AI – AI-Powered Student Expense and Budget Management System",
  tagline: "Small Budget. Big Dreams.",
  subject: "Digital Data & AI Literacy",
  department: "Computer Science and Engineering",
  university: "JECRC University, Jaipur",
  session: "2026–2027",
  guide: "Mr. Amit Sain, FIAT Trainer",
  disclaimer:
    "Academic demonstration project developed by B.Tech CSE students at JECRC University, Jaipur. Not officially endorsed by the university and not a substitute for regulated financial advice.",
};

export const SAMPLE_RECEIPTS = [
  {
    id: "sample-canteen",
    label: "JECRC Campus Canteen",
    subtitle: "Lunch & Cold Coffee Bill",
    merchantName: "JECRC Campus Canteen",
    totalAmount: 145,
    category: "Food" as ExpenseCategory,
    paymentMethod: "UPI" as PaymentMethod,
    items: [
      { name: "Paneer Masala Sandwich", qty: 1, price: 70 },
      { name: "Cold Coffee", qty: 1, price: 55 },
      { name: "Mineral Water 1L", qty: 1, price: 20 },
    ],
    rawReceiptLines: [
      "JECRC CAMPUS CANTEEN - BLOCK A",
      "Vidhani, Sitapura, Jaipur - 303905",
      "GSTIN: 08DEMO0000A1Z5 (FICTIONAL SAMPLE)",
      "----------------------------------------",
      "1x Paneer Masala Sandwich        Rs. 70.00",
      "1x Cold Coffee                   Rs. 55.00",
      "1x Mineral Water 1L              Rs. 20.00",
      "----------------------------------------",
      "TOTAL PAID (UPI)                Rs. 145.00",
      "Thank you! Have a great study day.",
    ],
  },
  {
    id: "sample-bookstore",
    label: "Crossword & Academic Books",
    subtitle: "DSA Textbook & Spiral Notebooks",
    merchantName: "Jaipur Student Book Depot",
    totalAmount: 380,
    category: "Education" as ExpenseCategory,
    paymentMethod: "Debit Card" as PaymentMethod,
    items: [
      { name: "Data Structures Lab Manual", qty: 1, price: 240 },
      { name: "A4 Spiral Notebooks (Pack of 2)", qty: 1, price: 140 },
    ],
    rawReceiptLines: [
      "JAIPUR STUDENT BOOK DEPOT",
      "Tonk Road, Sitapura, Jaipur",
      "TAX INVOICE (FICTIONAL SAMPLE RECEIPT)",
      "----------------------------------------",
      "Data Structures Lab Manual      Rs. 240.00",
      "A4 Spiral Notebooks x2          Rs. 140.00",
      "----------------------------------------",
      "GRAND TOTAL (CARD)              Rs. 380.00",
      "Student Discount Applied: Rs. 20",
    ],
  },
  {
    id: "sample-commute",
    label: "Jaipur Metro & Auto Pass",
    subtitle: "Campus Commute Recharge",
    merchantName: "Jaipur Metro Rail Corp",
    totalAmount: 210,
    category: "Transport" as ExpenseCategory,
    paymentMethod: "Wallet" as PaymentMethod,
    items: [
      { name: "Metro Smart Card Top-up", qty: 1, price: 150 },
      { name: "Last-mile E-Rickshaw", qty: 1, price: 60 },
    ],
    rawReceiptLines: [
      "JAIPUR METRO RAIL CORPORATION",
      "Sitapura - Mansarovar Corridor",
      "COMMUTE RECEIPT (FICTIONAL SAMPLE)",
      "----------------------------------------",
      "Smart Card Recharge             Rs. 150.00",
      "Feeder E-Rickshaw Pass          Rs.  60.00",
      "----------------------------------------",
      "TOTAL AMOUNT                    Rs. 210.00",
      "Mode: Digital Wallet",
    ],
  },
];
