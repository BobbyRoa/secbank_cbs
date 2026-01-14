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
    instapay: protectedProcedure
      .input(z.object({
        fromAccountId: z.number(),
        toBankCode: z.string(),
        toAccountNumber: z.string(),
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive"),
        description: z.string().optional(),
      }))
      .mutation(async () => {
        throw new TRPCError({ 
          code: "NOT_IMPLEMENTED", 
          message: "Instapay integration coming soon" 
        });
      }),
  }),

  // Dashboard statistics
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
