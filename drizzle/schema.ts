import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Branches table - 5 branches with code prefix
 * 001: Camaligan, 002: Buhi, 003: Calabanga, 004: Pili, 005: Aseana
 */
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Customers table - simplified, only name required
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Accounts table - 10-digit account number (3-digit prefix + 7-digit random)
 * Product type fixed as REGULAR_SAVING
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  branchCode: varchar("branchCode", { length: 3 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 10 }).notNull().unique(),
  balance: decimal("balance", { precision: 18, scale: 2 }).notNull().default("0.00"),
  productType: varchar("productType", { length: 50 }).notNull().default("REGULAR_SAVING"),
  status: mysqlEnum("status", ["active", "closed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Transactions table - with unique reference number
 * Reference format: TXN + YYYYMMDD + 6-digit sequence (e.g., TXN20260114000001)
 * Types: DEPOSIT, WITHDRAWAL, INTERNAL_TRANSFER, INSTAPAY
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 20 }).notNull().unique(),
  accountId: int("accountId").notNull(),
  type: mysqlEnum("type", ["DEPOSIT", "WITHDRAWAL", "INTERNAL_TRANSFER", "INSTAPAY"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 18, scale: 2 }).notNull(),
  relatedAccountId: int("relatedAccountId"),
  relatedAccountNumber: varchar("relatedAccountNumber", { length: 20 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Transaction sequence counter - for generating unique reference numbers per day
 */
export const transactionSequence = mysqlTable("transactionSequence", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 8 }).notNull().unique(),
  lastSequence: int("lastSequence").notNull().default(0),
});

export type TransactionSequence = typeof transactionSequence.$inferSelect;


/**
 * Instapay Transactions table - for interbank transfers via switch
 * Tracks outbound Instapay transactions with status updates from switch
 */
export const instapayTransactions = mysqlTable("instapayTransactions", {
  id: int("id").autoincrement().primaryKey(),
  /** Internal reference number from CBS */
  referenceNumber: varchar("referenceNumber", { length: 20 }).notNull().unique(),
  /** Reference number returned by switch */
  switchReferenceNumber: varchar("switchReferenceNumber", { length: 50 }),
  /** Source account ID in CBS */
  sourceAccountId: int("sourceAccountId").notNull(),
  /** Source account number */
  sourceAccountNumber: varchar("sourceAccountNumber", { length: 10 }).notNull(),
  /** Destination bank name */
  bankName: varchar("bankName", { length: 100 }).notNull(),
  /** Destination bank code */
  bankCode: varchar("bankCode", { length: 20 }).notNull(),
  /** Recipient account number at destination bank */
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  /** Recipient account name */
  accountName: varchar("accountName", { length: 255 }).notNull(),
  /** Transfer amount */
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  /** Transaction status: PENDING, SUCCESS, FAILED */
  status: mysqlEnum("status", ["PENDING", "SUCCESS", "FAILED"]).default("PENDING").notNull(),
  /** Status message from switch */
  statusMessage: text("statusMessage"),
  /** Timestamp when sent to switch */
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  /** Timestamp when status was last updated */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstapayTransaction = typeof instapayTransactions.$inferSelect;
export type InsertInstapayTransaction = typeof instapayTransactions.$inferInsert;
