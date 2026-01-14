import { eq, sql, and, gte, lt, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  branches, InsertBranch, Branch,
  customers, InsertCustomer, Customer,
  accounts, InsertAccount, Account,
  transactions, InsertTransaction, Transaction,
  transactionSequence
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Branch Functions ============
export async function getAllBranches(): Promise<Branch[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branches).orderBy(branches.code);
}

export async function getBranchByCode(code: string): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [branch] = await db.select().from(branches).where(eq(branches.code, code));
  return branch || null;
}

export async function createBranch(code: string, name: string): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(branches).values({ code, name });
  const insertId = result[0].insertId;
  
  const [branch] = await db.select().from(branches).where(eq(branches.id, insertId));
  return branch || null;
}

export async function updateBranch(id: number, name: string): Promise<Branch | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(branches).set({ name }).where(eq(branches.id, id));
  const [branch] = await db.select().from(branches).where(eq(branches.id, id));
  return branch || null;
}

export async function deleteBranch(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(branches).where(eq(branches.id, id));
  return true;
}

export async function seedBranches(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const branchData: InsertBranch[] = [
    { code: "001", name: "Camaligan" },
    { code: "002", name: "Buhi" },
    { code: "003", name: "Calabanga" },
    { code: "004", name: "Pili" },
    { code: "005", name: "Aseana" },
  ];

  for (const branch of branchData) {
    await db.insert(branches).values(branch).onDuplicateKeyUpdate({
      set: { name: branch.name },
    });
  }
}

// ============ Customer Functions ============
export async function createCustomer(name: string): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(customers).values({ name });
  const insertId = result[0].insertId;
  
  const [customer] = await db.select().from(customers).where(eq(customers.id, insertId));
  return customer || null;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  return customer || null;
}

export async function updateCustomer(id: number, name: string): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(customers).set({ name }).where(eq(customers.id, id));
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  return customer || null;
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if customer has accounts
  const customerAccounts = await db.select().from(accounts).where(eq(accounts.customerId, id));
  if (customerAccounts.length > 0) {
    throw new Error("Cannot delete customer with existing accounts");
  }

  await db.delete(customers).where(eq(customers.id, id));
  return true;
}

// Get customers with their total balance
export async function getCustomersWithBalance(): Promise<Array<Customer & { totalBalance: string; accountCount: number }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: customers.id,
      name: customers.name,
      createdAt: customers.createdAt,
      totalBalance: sql<string>`COALESCE(SUM(${accounts.balance}), 0)`.as('totalBalance'),
      accountCount: sql<number>`COUNT(${accounts.id})`.as('accountCount'),
    })
    .from(customers)
    .leftJoin(accounts, eq(customers.id, accounts.customerId))
    .groupBy(customers.id, customers.name, customers.createdAt)
    .orderBy(desc(customers.createdAt));

  return result;
}

// ============ Account Functions ============
export async function generateAccountNumber(branchCode: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let accountNumber: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const randomPart = Math.floor(1000000 + Math.random() * 9000000).toString();
    accountNumber = branchCode + randomPart;
    
    const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).limit(1);
    if (existing.length === 0) {
      return accountNumber;
    }
    attempts++;
  } while (attempts < maxAttempts);

  throw new Error("Failed to generate unique account number");
}

export async function createAccount(customerId: number, branchCode: string): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;

  const accountNumber = await generateAccountNumber(branchCode);
  
  const result = await db.insert(accounts).values({
    customerId,
    branchCode,
    accountNumber,
    balance: "0.00",
    productType: "REGULAR_SAVING",
  });

  const insertId = result[0].insertId;
  const [account] = await db.select().from(accounts).where(eq(accounts.id, insertId));
  return account || null;
}

export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
}

export async function getAccountById(id: number): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
  return account || null;
}

export async function getAccountByNumber(accountNumber: string): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [account] = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber));
  return account || null;
}

export async function getAccountsByCustomerId(customerId: number): Promise<Account[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts).where(eq(accounts.customerId, customerId));
}

export async function updateAccountBalance(accountId: number, newBalance: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(accounts).set({ balance: newBalance }).where(eq(accounts.id, accountId));
}

export async function updateAccountStatus(accountId: number, status: "active" | "closed"): Promise<Account | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(accounts).set({ status }).where(eq(accounts.id, accountId));
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  return account || null;
}

// Get accounts with customer info for display
export async function getAccountsWithCustomerInfo(): Promise<Array<Account & { customerName: string; branchName: string }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: accounts.id,
      customerId: accounts.customerId,
      branchCode: accounts.branchCode,
      accountNumber: accounts.accountNumber,
      balance: accounts.balance,
      productType: accounts.productType,
      status: accounts.status,
      createdAt: accounts.createdAt,
      updatedAt: accounts.updatedAt,
      customerName: customers.name,
      branchName: branches.name,
    })
    .from(accounts)
    .leftJoin(customers, eq(accounts.customerId, customers.id))
    .leftJoin(branches, eq(accounts.branchCode, branches.code))
    .orderBy(desc(accounts.createdAt));

  return result.map(r => ({
    ...r,
    customerName: r.customerName || "Unknown",
    branchName: r.branchName || "Unknown",
  }));
}

// ============ Transaction Functions ============
export async function generateTransactionReference(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const [existing] = await db.select().from(transactionSequence).where(eq(transactionSequence.date, dateStr));
  
  let sequence: number;
  if (existing) {
    sequence = existing.lastSequence + 1;
    await db.update(transactionSequence)
      .set({ lastSequence: sequence })
      .where(eq(transactionSequence.date, dateStr));
  } else {
    sequence = 1;
    await db.insert(transactionSequence).values({ date: dateStr, lastSequence: 1 });
  }

  return `TXN${dateStr}${sequence.toString().padStart(6, '0')}`;
}

export async function createTransaction(data: {
  accountId: number;
  type: "DEPOSIT" | "WITHDRAWAL" | "INTERNAL_TRANSFER" | "INSTAPAY";
  amount: string;
  balanceAfter: string;
  relatedAccountId?: number;
  relatedAccountNumber?: string;
  description?: string;
}): Promise<Transaction | null> {
  const db = await getDb();
  if (!db) return null;

  const referenceNumber = await generateTransactionReference();
  
  const result = await db.insert(transactions).values({
    referenceNumber,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    balanceAfter: data.balanceAfter,
    relatedAccountId: data.relatedAccountId,
    relatedAccountNumber: data.relatedAccountNumber,
    description: data.description,
  });

  const insertId = result[0].insertId;
  const [transaction] = await db.select().from(transactions).where(eq(transactions.id, insertId));
  return transaction || null;
}

export async function getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.createdAt));
}

export async function getAllTransactions(): Promise<Array<Transaction & { accountNumber: string; customerName: string }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: transactions.id,
      referenceNumber: transactions.referenceNumber,
      accountId: transactions.accountId,
      type: transactions.type,
      amount: transactions.amount,
      balanceAfter: transactions.balanceAfter,
      relatedAccountId: transactions.relatedAccountId,
      relatedAccountNumber: transactions.relatedAccountNumber,
      description: transactions.description,
      createdAt: transactions.createdAt,
      accountNumber: accounts.accountNumber,
      customerName: customers.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(customers, eq(accounts.customerId, customers.id))
    .orderBy(desc(transactions.createdAt))
    .limit(100);

  return result.map(r => ({
    ...r,
    accountNumber: r.accountNumber || "Unknown",
    customerName: r.customerName || "Unknown",
  }));
}

// ============ Dashboard Statistics ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalBalanceResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${accounts.balance}), 0)` })
    .from(accounts)
    .where(eq(accounts.status, "active"));

  const branchBalances = await db
    .select({
      branchCode: accounts.branchCode,
      total: sql<string>`COALESCE(SUM(${accounts.balance}), 0)`,
    })
    .from(accounts)
    .where(eq(accounts.status, "active"))
    .groupBy(accounts.branchCode);

  const [customerCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(customers);

  const [accountCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(accounts);

  const todayStats = await db
    .select({
      type: transactions.type,
      count: sql<number>`COUNT(*)`,
      total: sql<string>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
    })
    .from(transactions)
    .where(and(
      gte(transactions.createdAt, today),
      lt(transactions.createdAt, tomorrow)
    ))
    .groupBy(transactions.type);

  let todayTotalCount = 0;
  let todayTotalAmount = 0;
  const todayByType: Record<string, { count: number; amount: number }> = {
    DEPOSIT: { count: 0, amount: 0 },
    WITHDRAWAL: { count: 0, amount: 0 },
    INTERNAL_TRANSFER: { count: 0, amount: 0 },
    INSTAPAY: { count: 0, amount: 0 },
  };

  for (const stat of todayStats) {
    todayTotalCount += stat.count;
    todayTotalAmount += parseFloat(stat.total);
    if (stat.type in todayByType) {
      todayByType[stat.type] = {
        count: stat.count,
        amount: parseFloat(stat.total),
      };
    }
  }

  const allBranches = await getAllBranches();
  const branchBalanceMap: Record<string, string> = {};
  for (const bb of branchBalances) {
    branchBalanceMap[bb.branchCode] = bb.total;
  }

  return {
    totalBalance: totalBalanceResult?.total || "0",
    branchBalances: allBranches.map(b => ({
      code: b.code,
      name: b.name,
      balance: branchBalanceMap[b.code] || "0",
    })),
    totalCustomers: customerCount?.count || 0,
    totalAccounts: accountCount?.count || 0,
    todayTransactions: {
      total: todayTotalCount,
      totalAmount: todayTotalAmount.toFixed(2),
      deposits: todayByType.DEPOSIT,
      withdrawals: todayByType.WITHDRAWAL,
      internalTransfers: todayByType.INTERNAL_TRANSFER,
      instapay: todayByType.INSTAPAY,
    },
  };
}


// ============ Instapay Transaction Functions (Switch Integration) ============
import { instapayTransactions, InsertInstapayTransaction, InstapayTransaction } from "../drizzle/schema";

export interface CreateInstapayTransactionInput {
  sourceAccountId: number;
  sourceAccountNumber: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: string;
}

/**
 * Create a new Instapay transaction record with PENDING status
 * Deducts amount from source account
 */
export async function createInstapayTransaction(
  input: CreateInstapayTransactionInput
): Promise<InstapayTransaction | null> {
  const db = await getDb();
  if (!db) return null;

  // Generate reference number
  const referenceNumber = await generateTransactionReference();

  // Get source account and verify balance
  const sourceAccount = await getAccountById(input.sourceAccountId);
  if (!sourceAccount) {
    throw new Error("Source account not found");
  }
  if (sourceAccount.status !== "active") {
    throw new Error("Source account is not active");
  }

  const currentBalance = parseFloat(sourceAccount.balance);
  const transferAmount = parseFloat(input.amount);

  if (transferAmount <= 0) {
    throw new Error("Transfer amount must be greater than 0");
  }
  if (transferAmount > 50000) {
    throw new Error("Instapay transfers are limited to ₱50,000 per transaction");
  }
  if (currentBalance < transferAmount) {
    throw new Error("Insufficient balance");
  }

  // Deduct from source account
  const newBalance = (currentBalance - transferAmount).toFixed(2);
  await updateAccountBalance(input.sourceAccountId, newBalance);

  // Create transaction record in main transactions table
  await db.insert(transactions).values({
    referenceNumber,
    accountId: input.sourceAccountId,
    type: "INSTAPAY",
    amount: (-transferAmount).toFixed(2),
    balanceAfter: newBalance,
    relatedAccountNumber: input.accountNumber,
    description: `Instapay to ${input.accountName} at ${input.bankName}`,
  });

  // Create Instapay transaction record
  const result = await db.insert(instapayTransactions).values({
    referenceNumber,
    sourceAccountId: input.sourceAccountId,
    sourceAccountNumber: input.sourceAccountNumber,
    bankName: input.bankName,
    bankCode: input.bankCode,
    accountNumber: input.accountNumber,
    accountName: input.accountName,
    amount: input.amount,
    status: "PENDING",
  });

  const insertId = result[0].insertId;
  const [instapayTx] = await db
    .select()
    .from(instapayTransactions)
    .where(eq(instapayTransactions.id, insertId));

  return instapayTx || null;
}

/**
 * Get Instapay transaction by reference number
 */
export async function getInstapayTransactionByReference(
  referenceNumber: string
): Promise<InstapayTransaction | null> {
  const db = await getDb();
  if (!db) return null;

  const [tx] = await db
    .select()
    .from(instapayTransactions)
    .where(eq(instapayTransactions.referenceNumber, referenceNumber));

  return tx || null;
}

/**
 * Update Instapay transaction status (callback from switch)
 */
export async function updateInstapayTransactionStatus(
  referenceNumber: string,
  status: "PENDING" | "SUCCESS" | "FAILED",
  switchReferenceNumber?: string,
  statusMessage?: string
): Promise<InstapayTransaction | null> {
  const db = await getDb();
  if (!db) return null;

  const existingTx = await getInstapayTransactionByReference(referenceNumber);
  if (!existingTx) {
    throw new Error("Instapay transaction not found");
  }

  // If transaction failed, reverse the deduction
  if (status === "FAILED" && existingTx.status === "PENDING") {
    const sourceAccount = await getAccountById(existingTx.sourceAccountId);
    if (sourceAccount) {
      const currentBalance = parseFloat(sourceAccount.balance);
      const refundAmount = parseFloat(existingTx.amount);
      const newBalance = (currentBalance + refundAmount).toFixed(2);
      await updateAccountBalance(existingTx.sourceAccountId, newBalance);

      // Create reversal transaction record
      const reversalRef = await generateTransactionReference();
      await db.insert(transactions).values({
        referenceNumber: reversalRef,
        accountId: existingTx.sourceAccountId,
        type: "DEPOSIT",
        amount: refundAmount.toFixed(2),
        balanceAfter: newBalance,
        description: `Instapay reversal - ${referenceNumber} failed: ${statusMessage || "Transaction failed"}`,
      });
    }
  }

  // Update Instapay transaction status
  await db
    .update(instapayTransactions)
    .set({
      status,
      switchReferenceNumber: switchReferenceNumber || existingTx.switchReferenceNumber,
      statusMessage: statusMessage || existingTx.statusMessage,
    })
    .where(eq(instapayTransactions.referenceNumber, referenceNumber));

  const [updatedTx] = await db
    .select()
    .from(instapayTransactions)
    .where(eq(instapayTransactions.referenceNumber, referenceNumber));

  return updatedTx || null;
}

/**
 * Get all Instapay transactions (for admin view)
 */
export async function getAllInstapayTransactions(): Promise<InstapayTransaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(instapayTransactions)
    .orderBy(desc(instapayTransactions.sentAt))
    .limit(100);
}

/**
 * Get pending Instapay transactions (for monitoring/retry)
 */
export async function getPendingInstapayTransactions(): Promise<InstapayTransaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(instapayTransactions)
    .where(eq(instapayTransactions.status, "PENDING"))
    .orderBy(instapayTransactions.sentAt);
}
