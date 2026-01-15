/**
 * Secbank Core Banking System - REST API
 * 
 * This module provides REST API endpoints for external system integration.
 * All endpoints require API key authentication via X-API-Key header.
 */

import { Router, Request, Response, NextFunction } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { 
  apiKeys, 
  branches, 
  customers, 
  accounts, 
  transactions,
  instapayTransactions 
} from "../drizzle/schema";
import crypto from "crypto";
import * as db from "./db";

// Types
interface ApiKeyInfo {
  id: number;
  name: string;
  permissions: "read" | "write" | "admin";
}

interface AuthenticatedRequest extends Request {
  apiKey?: ApiKeyInfo;
}

// ============================================
// API Key Utilities
// ============================================

/**
 * Generate a new API key
 * Returns the raw key (only shown once) and the hash for storage
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sb_${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.substring(0, 11); // "sb_" + first 8 chars
  return { key, hash, prefix };
}

/**
 * Hash an API key for comparison
 */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// ============================================
// Authentication Middleware
// ============================================

async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKeyHeader = req.headers["x-api-key"] as string;

  if (!apiKeyHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing X-API-Key header"
      }
    });
    return;
  }

  try {
    const database = await getDb();
    if (!database) {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Database not available"
        }
      });
      return;
    }

    const keyHash = hashApiKey(apiKeyHeader);
    const [keyRecord] = await database
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!keyRecord) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid API key"
        }
      });
      return;
    }

    if (!keyRecord.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "API key is inactive"
        }
      });
      return;
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "API key has expired"
        }
      });
      return;
    }

    // Update last used timestamp
    await database
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: keyRecord.permissions
    };

    next();
  } catch (error) {
    console.error("[REST API] Authentication error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication failed"
      }
    });
  }
}

/**
 * Check if the API key has write permissions
 */
function requireWritePermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.apiKey?.permissions === "read") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "API key lacks write permission"
      }
    });
    return;
  }
  next();
}

/**
 * Check if the API key has admin permissions
 */
function requireAdminPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.apiKey?.permissions !== "admin") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "API key lacks admin permission"
      }
    });
    return;
  }
  next();
}

// ============================================
// REST API Router
// ============================================

export const restApiRouter = Router();

// Apply authentication to all routes
restApiRouter.use(authenticateApiKey);

// ============================================
// Branches Endpoints
// ============================================

// GET /api/v1/branches - List all branches
restApiRouter.get("/branches", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const branchList = await db.getAllBranches();
    res.json({
      success: true,
      data: branchList
    });
  } catch (error) {
    console.error("[REST API] Error fetching branches:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch branches"
      }
    });
  }
});

// GET /api/v1/branches/:id - Get branch by ID
restApiRouter.get("/branches/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const [branch] = await database
      .select()
      .from(branches)
      .where(eq(branches.id, parseInt(req.params.id)))
      .limit(1);

    if (!branch) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Branch not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error("[REST API] Error fetching branch:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch branch"
      }
    });
  }
});

// POST /api/v1/branches - Create branch
restApiRouter.post("/branches", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name } = req.body;

    if (!code || !name) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Branch code and name are required"
        }
      });
      return;
    }

    const branch = await db.createBranch(code, name);
    res.status(201).json({
      success: true,
      data: branch,
      message: "Branch created successfully"
    });
  } catch (error) {
    console.error("[REST API] Error creating branch:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create branch"
      }
    });
  }
});

// PUT /api/v1/branches/:id - Update branch
restApiRouter.put("/branches/:id", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const id = parseInt(req.params.id);

    const branch = await db.updateBranch(id, name);
    
    if (!branch) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Branch not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: branch,
      message: "Branch updated successfully"
    });
  } catch (error) {
    console.error("[REST API] Error updating branch:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update branch"
      }
    });
  }
});

// DELETE /api/v1/branches/:id - Delete branch
restApiRouter.delete("/branches/:id", requireAdminPermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteBranch(id);

    res.json({
      success: true,
      message: "Branch deleted successfully"
    });
  } catch (error) {
    console.error("[REST API] Error deleting branch:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete branch"
      }
    });
  }
});

// ============================================
// Customers Endpoints
// ============================================

// GET /api/v1/customers - List all customers
restApiRouter.get("/customers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, limit = "50", offset = "0" } = req.query;
    const customerList = await db.getAllCustomers();
    
    let filtered = customerList;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = customerList.filter(c => 
        c.name.toLowerCase().includes(searchLower)
      );
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginated,
      meta: {
        total: filtered.length,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch customers"
      }
    });
  }
});

// GET /api/v1/customers/:id - Get customer by ID
restApiRouter.get("/customers/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const [customer] = await database
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(req.params.id)))
      .limit(1);

    if (!customer) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Customer not found"
        }
      });
      return;
    }

    // Get customer's accounts
    const customerAccounts = await database
      .select()
      .from(accounts)
      .where(eq(accounts.customerId, customer.id));

    res.json({
      success: true,
      data: {
        ...customer,
        accounts: customerAccounts
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch customer"
      }
    });
  }
});

// POST /api/v1/customers - Create customer
restApiRouter.post("/customers", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Customer name is required"
        }
      });
      return;
    }

    const customer = await db.createCustomer(name);
    res.status(201).json({
      success: true,
      data: customer,
      message: "Customer created successfully"
    });
  } catch (error) {
    console.error("[REST API] Error creating customer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create customer"
      }
    });
  }
});

// PUT /api/v1/customers/:id - Update customer
restApiRouter.put("/customers/:id", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const id = parseInt(req.params.id);

    const customer = await db.updateCustomer(id, name);
    
    if (!customer) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Customer not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: customer,
      message: "Customer updated successfully"
    });
  } catch (error) {
    console.error("[REST API] Error updating customer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update customer"
      }
    });
  }
});

// DELETE /api/v1/customers/:id - Delete customer
restApiRouter.delete("/customers/:id", requireAdminPermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteCustomer(id);

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("[REST API] Error deleting customer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete customer"
      }
    });
  }
});

// ============================================
// Accounts Endpoints
// ============================================

// GET /api/v1/accounts - List all accounts
restApiRouter.get("/accounts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, branchCode, status, limit = "50", offset = "0" } = req.query;
    const accountList = await db.getAllAccounts();
    
    let filtered = accountList;
    if (customerId) {
      filtered = filtered.filter(a => a.customerId === parseInt(customerId as string));
    }
    if (branchCode) {
      filtered = filtered.filter(a => a.branchCode === branchCode);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginated,
      meta: {
        total: filtered.length,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching accounts:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch accounts"
      }
    });
  }
});

// GET /api/v1/accounts/:id - Get account by ID
restApiRouter.get("/accounts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await db.getAccountById(parseInt(req.params.id));

    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error("[REST API] Error fetching account:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch account"
      }
    });
  }
});

// GET /api/v1/accounts/number/:accountNumber - Get account by account number
restApiRouter.get("/accounts/number/:accountNumber", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await db.getAccountByNumber(req.params.accountNumber);

    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error("[REST API] Error fetching account:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch account"
      }
    });
  }
});

// GET /api/v1/accounts/:id/balance - Get account balance
restApiRouter.get("/accounts/:id/balance", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const account = await db.getAccountById(parseInt(req.params.id));

    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        balance: parseFloat(account.balance),
        availableBalance: parseFloat(account.balance),
        currency: "PHP"
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching balance:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch balance"
      }
    });
  }
});

// POST /api/v1/accounts - Create account
restApiRouter.post("/accounts", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, branchCode } = req.body;

    if (!customerId || !branchCode) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Customer ID and branch code are required"
        }
      });
      return;
    }

    const account = await db.createAccount(customerId, branchCode);

    res.status(201).json({
      success: true,
      data: account,
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("[REST API] Error creating account:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create account"
      }
    });
  }
});

// PUT /api/v1/accounts/:id/status - Update account status
restApiRouter.put("/accounts/:id/status", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);

    if (!status || !["active", "closed"].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid status (active/closed) is required"
        }
      });
      return;
    }

    const account = await db.updateAccountStatus(id, status);
    
    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: account,
      message: "Account status updated successfully"
    });
  } catch (error) {
    console.error("[REST API] Error updating account status:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update account status"
      }
    });
  }
});

// GET /api/v1/accounts/:id/transactions - Get account transactions
restApiRouter.get("/accounts/:id/transactions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = "50", offset = "0" } = req.query;
    const id = parseInt(req.params.id);
    
    const txnList = await db.getTransactionsByAccountId(id);
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = txnList.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginated,
      meta: {
        total: txnList.length,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transactions"
      }
    });
  }
});

// ============================================
// Transactions Endpoints
// ============================================

// GET /api/v1/transactions - List all transactions
restApiRouter.get("/transactions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId, type, limit = "50", offset = "0" } = req.query;
    const txnList = await db.getAllTransactions();
    
    let filtered = txnList;
    if (accountId) {
      filtered = filtered.filter(t => t.accountId === parseInt(accountId as string));
    }
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginated,
      meta: {
        total: filtered.length,
        limit: limitNum,
        offset: offsetNum
      }
    });
  } catch (error) {
    console.error("[REST API] Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transactions"
      }
    });
  }
});

// GET /api/v1/transactions/:referenceNumber - Get transaction by reference number
restApiRouter.get("/transactions/:referenceNumber", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const [txn] = await database
      .select()
      .from(transactions)
      .where(eq(transactions.referenceNumber, req.params.referenceNumber))
      .limit(1);

    if (!txn) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Transaction not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: txn
    });
  } catch (error) {
    console.error("[REST API] Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transaction"
      }
    });
  }
});

// POST /api/v1/transactions/deposit - Create deposit
restApiRouter.post("/transactions/deposit", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber, amount, description } = req.body;

    if (!accountNumber || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid account number and positive amount are required"
        }
      });
      return;
    }

    const account = await db.getAccountByNumber(accountNumber);
    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    if (account.status === "closed") {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_CLOSED",
          message: "Cannot deposit to a closed account"
        }
      });
      return;
    }

    const currentBalance = parseFloat(account.balance);
    const depositAmount = parseFloat(amount);
    const newBalance = (currentBalance + depositAmount).toFixed(2);

    await db.updateAccountBalance(account.id, newBalance);

    const transaction = await db.createTransaction({
      accountId: account.id,
      type: "DEPOSIT",
      amount: depositAmount.toFixed(2),
      balanceAfter: newBalance,
      description: description || "Deposit via API"
    });

    res.status(201).json({
      success: true,
      data: {
        referenceNumber: transaction?.referenceNumber,
        type: "DEPOSIT",
        amount: depositAmount,
        newBalance: parseFloat(newBalance)
      },
      message: "Deposit successful"
    });
  } catch (error) {
    console.error("[REST API] Error creating deposit:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process deposit"
      }
    });
  }
});

// POST /api/v1/transactions/withdrawal - Create withdrawal
restApiRouter.post("/transactions/withdrawal", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountNumber, amount, description } = req.body;

    if (!accountNumber || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid account number and positive amount are required"
        }
      });
      return;
    }

    const account = await db.getAccountByNumber(accountNumber);
    if (!account) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Account not found"
        }
      });
      return;
    }

    if (account.status === "closed") {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_CLOSED",
          message: "Cannot withdraw from a closed account"
        }
      });
      return;
    }

    const currentBalance = parseFloat(account.balance);
    const withdrawAmount = parseFloat(amount);

    if (currentBalance < withdrawAmount) {
      res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: `Insufficient balance. Available: ${currentBalance}`
        }
      });
      return;
    }

    const newBalance = (currentBalance - withdrawAmount).toFixed(2);

    await db.updateAccountBalance(account.id, newBalance);

    const transaction = await db.createTransaction({
      accountId: account.id,
      type: "WITHDRAWAL",
      amount: `-${withdrawAmount.toFixed(2)}`,
      balanceAfter: newBalance,
      description: description || "Withdrawal via API"
    });

    res.status(201).json({
      success: true,
      data: {
        referenceNumber: transaction?.referenceNumber,
        type: "WITHDRAWAL",
        amount: withdrawAmount,
        newBalance: parseFloat(newBalance)
      },
      message: "Withdrawal successful"
    });
  } catch (error) {
    console.error("[REST API] Error creating withdrawal:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process withdrawal"
      }
    });
  }
});

// POST /api/v1/transactions/transfer - Create internal transfer
restApiRouter.post("/transactions/transfer", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceAccountNumber, destinationAccountNumber, amount, description } = req.body;

    if (!sourceAccountNumber || !destinationAccountNumber || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid source account, destination account, and positive amount are required"
        }
      });
      return;
    }

    if (sourceAccountNumber === destinationAccountNumber) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Source and destination accounts must be different"
        }
      });
      return;
    }

    const sourceAccount = await db.getAccountByNumber(sourceAccountNumber);
    const destAccount = await db.getAccountByNumber(destinationAccountNumber);

    if (!sourceAccount) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Source account not found"
        }
      });
      return;
    }

    if (!destAccount) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Destination account not found"
        }
      });
      return;
    }

    if (sourceAccount.status === "closed") {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_CLOSED",
          message: "Cannot transfer from a closed account"
        }
      });
      return;
    }

    if (destAccount.status === "closed") {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_CLOSED",
          message: "Cannot transfer to a closed account"
        }
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    const sourceBalance = parseFloat(sourceAccount.balance);

    if (sourceBalance < transferAmount) {
      res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: `Insufficient balance. Available: ${sourceBalance}`
        }
      });
      return;
    }

    const newSourceBalance = (sourceBalance - transferAmount).toFixed(2);
    const newDestBalance = (parseFloat(destAccount.balance) + transferAmount).toFixed(2);

    // Update balances
    await db.updateAccountBalance(sourceAccount.id, newSourceBalance);
    await db.updateAccountBalance(destAccount.id, newDestBalance);

    // Create sender transaction
    const senderTx = await db.createTransaction({
      accountId: sourceAccount.id,
      type: "INTERNAL_TRANSFER",
      amount: `-${transferAmount.toFixed(2)}`,
      balanceAfter: newSourceBalance,
      relatedAccountId: destAccount.id,
      relatedAccountNumber: destAccount.accountNumber,
      description: description || `Transfer to ${destAccount.accountNumber}`
    });

    // Create receiver transaction
    await db.createTransaction({
      accountId: destAccount.id,
      type: "INTERNAL_TRANSFER",
      amount: transferAmount.toFixed(2),
      balanceAfter: newDestBalance,
      relatedAccountId: sourceAccount.id,
      relatedAccountNumber: sourceAccount.accountNumber,
      description: description || `Transfer from ${sourceAccount.accountNumber}`
    });

    res.status(201).json({
      success: true,
      data: {
        referenceNumber: senderTx?.referenceNumber,
        type: "INTERNAL_TRANSFER",
        amount: transferAmount,
        sourceAccount: {
          accountNumber: sourceAccountNumber,
          newBalance: parseFloat(newSourceBalance)
        },
        destinationAccount: {
          accountNumber: destinationAccountNumber,
          newBalance: parseFloat(newDestBalance)
        }
      },
      message: "Transfer successful"
    });
  } catch (error) {
    console.error("[REST API] Error creating transfer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process transfer"
      }
    });
  }
});

// ============================================
// Instapay Endpoints
// ============================================

// POST /api/v1/instapay/send - Initiate Instapay transfer
restApiRouter.post("/instapay/send", requireWritePermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      sourceAccountNumber, 
      destinationBank, 
      destinationAccountNumber, 
      destinationAccountName, 
      amount, 
    } = req.body;

    if (!sourceAccountNumber || !destinationBank || !destinationAccountNumber || !destinationAccountName || !amount) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "All fields are required: sourceAccountNumber, destinationBank, destinationAccountNumber, destinationAccountName, amount"
        }
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || transferAmount > 50000) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Amount must be between 1 and 50,000 PHP"
        }
      });
      return;
    }

    const sourceAccount = await db.getAccountByNumber(sourceAccountNumber);
    if (!sourceAccount) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Source account not found"
        }
      });
      return;
    }

    if (sourceAccount.status === "closed") {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_CLOSED",
          message: "Cannot transfer from a closed account"
        }
      });
      return;
    }

    const balance = parseFloat(sourceAccount.balance);
    if (balance < transferAmount) {
      res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: `Insufficient balance. Available: ${balance}`
        }
      });
      return;
    }

    // Bank code mapping
    const bankCodes: Record<string, string> = {
      "BDO": "BDO",
      "BPI": "BPI",
      "Metrobank": "MBTC",
      "UnionBank": "UBP",
      "Landbank": "LBP"
    };

    const bankCode = bankCodes[destinationBank] || destinationBank;

    const result = await db.createInstapayTransaction({
      sourceAccountId: sourceAccount.id,
      sourceAccountNumber,
      bankName: destinationBank,
      bankCode,
      accountNumber: destinationAccountNumber,
      accountName: destinationAccountName,
      amount: transferAmount.toFixed(2)
    });

    if (!result) {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create Instapay transaction"
        }
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        referenceNumber: result.referenceNumber,
        status: "PENDING",
        amount: transferAmount,
        fee: 0,
        totalAmount: transferAmount,
        destinationBank,
        destinationAccountNumber,
        destinationAccountName,
        sourceAccountNumber: result.sourceAccountNumber
      },
      message: "Instapay transfer initiated"
    });
  } catch (error) {
    console.error("[REST API] Error creating Instapay transfer:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to initiate Instapay transfer"
      }
    });
  }
});

// GET /api/v1/instapay/status/:referenceNumber - Get Instapay transaction status
restApiRouter.get("/instapay/status/:referenceNumber", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transaction = await db.getInstapayTransactionByReference(req.params.referenceNumber);

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Instapay transaction not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error("[REST API] Error fetching Instapay status:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch Instapay status"
      }
    });
  }
});

// POST /api/v1/instapay/callback - Instapay callback from switch
restApiRouter.post("/instapay/callback", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { referenceNumber, status, switchReferenceNumber, message } = req.body;

    if (!referenceNumber || !status) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Reference number and status are required"
        }
      });
      return;
    }

    if (!["SUCCESS", "FAILED", "PENDING"].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid status. Must be SUCCESS, FAILED, or PENDING"
        }
      });
      return;
    }

    const result = await db.updateInstapayTransactionStatus(
      referenceNumber,
      status,
      switchReferenceNumber,
      message
    );

    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Instapay transaction not found"
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        acknowledged: true,
        referenceNumber,
        status: result.status
      }
    });
  } catch (error) {
    console.error("[REST API] Error processing Instapay callback:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process callback"
      }
    });
  }
});

// ============================================
// Dashboard Endpoints
// ============================================

// GET /api/v1/dashboard/stats - Get dashboard statistics
restApiRouter.get("/dashboard/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await db.getDashboardStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("[REST API] Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch dashboard statistics"
      }
    });
  }
});

// ============================================
// API Key Management Endpoints (Admin only)
// ============================================

// GET /api/v1/api-keys - List all API keys
restApiRouter.get("/api-keys", requireAdminPermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const keys = await database
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        description: apiKeys.description,
        permissions: apiKeys.permissions,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));

    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error("[REST API] Error fetching API keys:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch API keys"
      }
    });
  }
});

// POST /api/v1/api-keys - Create new API key
restApiRouter.post("/api-keys", requireAdminPermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, permissions = "read", expiresAt } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "API key name is required"
        }
      });
      return;
    }

    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const { key, hash, prefix } = generateApiKey();

    await database.insert(apiKeys).values({
      keyHash: hash,
      keyPrefix: prefix,
      name,
      description,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.apiKey?.id
    });

    res.status(201).json({
      success: true,
      data: {
        key, // Only returned once!
        keyPrefix: prefix,
        name,
        permissions
      },
      message: "API key created. Save the key now - it won't be shown again!"
    });
  } catch (error) {
    console.error("[REST API] Error creating API key:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create API key"
      }
    });
  }
});

// DELETE /api/v1/api-keys/:id - Revoke API key
restApiRouter.delete("/api-keys/:id", requireAdminPermission, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const id = parseInt(req.params.id);

    await database
      .update(apiKeys)
      .set({ isActive: 0 })
      .where(eq(apiKeys.id, id));

    res.json({
      success: true,
      message: "API key revoked successfully"
    });
  } catch (error) {
    console.error("[REST API] Error revoking API key:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to revoke API key"
      }
    });
  }
});
