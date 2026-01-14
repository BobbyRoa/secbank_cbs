import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllBranches,
  getBranchByCode,
  createBranch,
  updateBranch,
  deleteBranch,
  seedBranches,
  createCustomer,
  getCustomersWithBalance,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createAccount,
  getAccountById,
  getAccountByNumber,
  getAccountsByCustomerId,
  getAccountsWithCustomerInfo,
  updateAccountBalance,
  updateAccountStatus,
  createTransaction,
  getTransactionsByAccountId,
  getAllTransactions,
  getDashboardStats,
  // Instapay functions
  createInstapayTransaction,
  getInstapayTransactionByReference,
  updateInstapayTransactionStatus,
  getAllInstapayTransactions,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Branch routes
  branch: router({
    list: publicProcedure.query(async () => {
      return await getAllBranches();
    }),
    getByCode: protectedProcedure
      .input(z.object({ code: z.string().length(3) }))
      .query(async ({ input }) => {
        return await getBranchByCode(input.code);
      }),
    create: protectedProcedure
      .input(z.object({ 
        code: z.string().length(3, "Branch code must be 3 characters"),
        name: z.string().min(1, "Name is required") 
      }))
      .mutation(async ({ input }) => {
        const branch = await createBranch(input.code, input.name);
        if (!branch) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create branch" });
        }
        return branch;
      }),
    update: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        name: z.string().min(1, "Name is required") 
      }))
      .mutation(async ({ input }) => {
        const branch = await updateBranch(input.id, input.name);
        if (!branch) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Branch not found" });
        }
        return branch;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBranch(input.id);
        return { success: true };
      }),
    seed: protectedProcedure.mutation(async () => {
      await seedBranches();
      return { success: true };
    }),
  }),

  // Customer routes
  customer: router({
    list: protectedProcedure.query(async () => {
      return await getCustomersWithBalance();
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1, "Name is required") }))
      .mutation(async ({ input }) => {
        const customer = await createCustomer(input.name);
        if (!customer) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create customer" });
        }
        return customer;
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCustomerById(input.id);
      }),
    update: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        name: z.string().min(1, "Name is required") 
      }))
      .mutation(async ({ input }) => {
        const customer = await updateCustomer(input.id, input.name);
        if (!customer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }
        return customer;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteCustomer(input.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: error instanceof Error ? error.message : "Failed to delete customer" 
          });
        }
      }),
  }),

  // Account routes
  account: router({
    list: protectedProcedure.query(async () => {
      return await getAccountsWithCustomerInfo();
    }),
    create: protectedProcedure
      .input(z.object({
        customerId: z.number(),
        branchCode: z.string().length(3),
      }))
      .mutation(async ({ input }) => {
        const account = await createAccount(input.customerId, input.branchCode);
        if (!account) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
        }
        return account;
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getAccountById(input.id);
      }),
    getByNumber: protectedProcedure
      .input(z.object({ accountNumber: z.string() }))
      .query(async ({ input }) => {
        return await getAccountByNumber(input.accountNumber);
      }),
    getByCustomerId: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await getAccountsByCustomerId(input.customerId);
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "closed"]),
      }))
      .mutation(async ({ input }) => {
        const account = await updateAccountStatus(input.id, input.status);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
        }
        return account;
      }),
  }),

  // Transaction routes
  transaction: router({
    list: protectedProcedure.query(async () => {
      return await getAllTransactions();
    }),
    history: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ input }) => {
        return await getTransactionsByAccountId(input.accountId);
      }),
    deposit: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const account = await getAccountById(input.accountId);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
        }

        const currentBalance = parseFloat(account.balance);
        const depositAmount = parseFloat(input.amount);
        const newBalance = (currentBalance + depositAmount).toFixed(2);

        await updateAccountBalance(input.accountId, newBalance);

        const transaction = await createTransaction({
          accountId: input.accountId,
          type: "DEPOSIT",
          amount: input.amount,
          balanceAfter: newBalance,
          description: input.description || "Manual Deposit",
        });

        return transaction;
      }),
    withdraw: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const account = await getAccountById(input.accountId);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
        }

        const currentBalance = parseFloat(account.balance);
        const withdrawAmount = parseFloat(input.amount);

        if (withdrawAmount > currentBalance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        const newBalance = (currentBalance - withdrawAmount).toFixed(2);

        await updateAccountBalance(input.accountId, newBalance);

        const transaction = await createTransaction({
          accountId: input.accountId,
          type: "WITHDRAWAL",
          amount: `-${input.amount}`,
          balanceAfter: newBalance,
          description: input.description || "Manual Withdrawal",
        });

        return transaction;
      }),
    internalTransfer: protectedProcedure
      .input(z.object({
        fromAccountId: z.number(),
        toAccountNumber: z.string().length(10),
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const fromAccount = await getAccountById(input.fromAccountId);
        if (!fromAccount) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Source account not found" });
        }

        const toAccount = await getAccountByNumber(input.toAccountNumber);
        if (!toAccount) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Destination account not found" });
        }

        if (fromAccount.id === toAccount.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot transfer to the same account" });
        }

        const transferAmount = parseFloat(input.amount);
        const fromBalance = parseFloat(fromAccount.balance);

        if (transferAmount > fromBalance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        const newFromBalance = (fromBalance - transferAmount).toFixed(2);
        const newToBalance = (parseFloat(toAccount.balance) + transferAmount).toFixed(2);

        await updateAccountBalance(fromAccount.id, newFromBalance);
        await updateAccountBalance(toAccount.id, newToBalance);

        const senderTx = await createTransaction({
          accountId: fromAccount.id,
          type: "INTERNAL_TRANSFER",
          amount: `-${input.amount}`,
          balanceAfter: newFromBalance,
          relatedAccountId: toAccount.id,
          relatedAccountNumber: toAccount.accountNumber,
          description: input.description || `Transfer to ${toAccount.accountNumber}`,
        });

        await createTransaction({
          accountId: toAccount.id,
          type: "INTERNAL_TRANSFER",
          amount: input.amount,
          balanceAfter: newToBalance,
          relatedAccountId: fromAccount.id,
          relatedAccountNumber: fromAccount.accountNumber,
          description: input.description || `Transfer from ${fromAccount.accountNumber}`,
        });

        return senderTx;
      }),
  }),

  // Dashboard statistics
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await getDashboardStats();
    }),
  }),

  // ============ Switch API Integration (Instapay) ============
  // These endpoints are for communication between CBS and Switch
  
  switch: router({
    // List all Instapay transactions (for admin monitoring)
    instapayList: protectedProcedure.query(async () => {
      return await getAllInstapayTransactions();
    }),

    /**
     * POST /api/switch/instapay/send
     * CBS → Switch: Initiate an Instapay transfer
     * Called by the CBS UI when user initiates an interbank transfer
     */
    instapaySend: protectedProcedure
      .input(z.object({
        sourceAccountId: z.number(),
        bankCode: z.string().min(1, "Bank code is required"),
        bankName: z.string().min(1, "Bank name is required"),
        accountNumber: z.string().min(1, "Account number is required"),
        accountName: z.string().min(1, "Account name is required"),
        amount: z.string().refine(
          val => parseFloat(val) > 0 && parseFloat(val) <= 50000, 
          "Amount must be between 0.01 and 50,000"
        ),
      }))
      .mutation(async ({ input }) => {
        try {
          // Get source account details
          const sourceAccount = await getAccountById(input.sourceAccountId);
          if (!sourceAccount) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Source account not found" });
          }

          // Create Instapay transaction (deducts from account, creates records)
          const instapayTx = await createInstapayTransaction({
            sourceAccountId: input.sourceAccountId,
            sourceAccountNumber: sourceAccount.accountNumber,
            bankName: input.bankName,
            bankCode: input.bankCode,
            accountNumber: input.accountNumber,
            accountName: input.accountName,
            amount: input.amount,
          });

          if (!instapayTx) {
            throw new TRPCError({ 
              code: "INTERNAL_SERVER_ERROR", 
              message: "Failed to create Instapay transaction" 
            });
          }

          // Return the transaction details for the switch to process
          // The switch will use this data to format the ISO 20022 message
          return {
            success: true,
            referenceNumber: instapayTx.referenceNumber,
            status: instapayTx.status,
            message: "Transaction created and pending switch processing",
            // Data for switch to send to Instapay network
            switchPayload: {
              referenceNumber: instapayTx.referenceNumber,
              sourceAccountNumber: instapayTx.sourceAccountNumber,
              bankCode: instapayTx.bankCode,
              bankName: instapayTx.bankName,
              accountNumber: instapayTx.accountNumber,
              accountName: instapayTx.accountName,
              amount: instapayTx.amount,
              sentAt: instapayTx.sentAt,
            },
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to process Instapay transfer",
          });
        }
      }),

    /**
     * POST /api/switch/instapay/callback
     * Switch → CBS: Receive status update from switch
     * Called by the switch when transaction status changes
     */
    instapayCallback: publicProcedure
      .input(z.object({
        referenceNumber: z.string().min(1, "Reference number is required"),
        status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
        switchReferenceNumber: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const updatedTx = await updateInstapayTransactionStatus(
            input.referenceNumber,
            input.status,
            input.switchReferenceNumber,
            input.message
          );

          if (!updatedTx) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Transaction not found",
            });
          }

          return {
            acknowledged: true,
            referenceNumber: updatedTx.referenceNumber,
            status: updatedTx.status,
            message: `Transaction status updated to ${updatedTx.status}`,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to process callback",
          });
        }
      }),

    /**
     * GET /api/switch/instapay/status/:referenceNumber
     * CBS ↔ Switch: Query transaction status
     * Can be called by either CBS or Switch to check transaction status
     */
    instapayStatus: publicProcedure
      .input(z.object({
        referenceNumber: z.string().min(1, "Reference number is required"),
      }))
      .query(async ({ input }) => {
        const tx = await getInstapayTransactionByReference(input.referenceNumber);

        if (!tx) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }

        return {
          referenceNumber: tx.referenceNumber,
          switchReferenceNumber: tx.switchReferenceNumber,
          status: tx.status,
          statusMessage: tx.statusMessage,
          sourceAccountNumber: tx.sourceAccountNumber,
          bankCode: tx.bankCode,
          bankName: tx.bankName,
          accountNumber: tx.accountNumber,
          accountName: tx.accountName,
          amount: tx.amount,
          sentAt: tx.sentAt,
          updatedAt: tx.updatedAt,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
