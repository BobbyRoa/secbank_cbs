import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { seedBranches, createCustomer, createAccount, getAccountById } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Switch API - Instapay Integration", () => {
  let testAccountId: number;
  let testAccountNumber: string;

  beforeAll(async () => {
    // Seed branches and create test data
    await seedBranches();
    
    // Create a test customer
    const customer = await createCustomer("Switch Test Customer");
    if (!customer) throw new Error("Failed to create test customer");
    
    // Create a test account with balance
    const account = await createAccount(customer.id, "001");
    if (!account) throw new Error("Failed to create test account");
    
    testAccountId = account.id;
    testAccountNumber = account.accountNumber;

    // Add balance to the account for testing
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.transaction.deposit({
      accountId: testAccountId,
      amount: "100000",
      description: "Test deposit for Instapay tests",
    });
  });

  describe("switch.instapaySend", () => {
    it("should create an Instapay transaction with PENDING status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.switch.instapaySend({
        sourceAccountId: testAccountId,
        bankCode: "BDO",
        bankName: "BDO Unibank",
        accountNumber: "1234567890",
        accountName: "Juan Dela Cruz",
        amount: "1000",
      });

      expect(result.success).toBe(true);
      expect(result.referenceNumber).toBeDefined();
      expect(result.referenceNumber).toMatch(/^TXN\d{14}$/);
      expect(result.status).toBe("PENDING");
      expect(result.switchPayload).toBeDefined();
      expect(result.switchPayload.bankCode).toBe("BDO");
      expect(parseFloat(result.switchPayload.amount)).toBe(1000);
    });

    it("should reject transfers exceeding ₱50,000 limit", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.switch.instapaySend({
          sourceAccountId: testAccountId,
          bankCode: "BPI",
          bankName: "Bank of the Philippine Islands",
          accountNumber: "9876543210",
          accountName: "Maria Santos",
          amount: "50001",
        })
      ).rejects.toThrow();
    });

    it("should deduct amount from source account", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get initial balance
      const accountBefore = await getAccountById(testAccountId);
      const balanceBefore = parseFloat(accountBefore?.balance || "0");

      // Make transfer
      await caller.switch.instapaySend({
        sourceAccountId: testAccountId,
        bankCode: "MBT",
        bankName: "Metrobank",
        accountNumber: "5555555555",
        accountName: "Pedro Reyes",
        amount: "500",
      });

      // Check balance after
      const accountAfter = await getAccountById(testAccountId);
      const balanceAfter = parseFloat(accountAfter?.balance || "0");

      expect(balanceAfter).toBe(balanceBefore - 500);
    });
  });

  describe("switch.instapayStatus", () => {
    it("should return transaction status by reference number", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a transaction first
      const sendResult = await caller.switch.instapaySend({
        sourceAccountId: testAccountId,
        bankCode: "UBP",
        bankName: "UnionBank of the Philippines",
        accountNumber: "1111111111",
        accountName: "Ana Garcia",
        amount: "250",
      });

      // Query status (can be called without auth)
      const publicCaller = appRouter.createCaller(createPublicContext());
      const status = await publicCaller.switch.instapayStatus({
        referenceNumber: sendResult.referenceNumber,
      });

      expect(status.referenceNumber).toBe(sendResult.referenceNumber);
      expect(status.status).toBe("PENDING");
      expect(status.bankCode).toBe("UBP");
      expect(status.accountName).toBe("Ana Garcia");
      expect(parseFloat(status.amount)).toBe(250);
    });

    it("should throw error for non-existent reference", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(
        caller.switch.instapayStatus({
          referenceNumber: "TXN99999999999999",
        })
      ).rejects.toThrow("Transaction not found");
    });
  });

  describe("switch.instapayCallback", () => {
    it("should update transaction status to SUCCESS", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a transaction
      const sendResult = await caller.switch.instapaySend({
        sourceAccountId: testAccountId,
        bankCode: "LBP",
        bankName: "Land Bank of the Philippines",
        accountNumber: "2222222222",
        accountName: "Carlos Mendoza",
        amount: "750",
      });

      // Simulate callback from switch (can be called without auth)
      const publicCaller = appRouter.createCaller(createPublicContext());
      const callbackResult = await publicCaller.switch.instapayCallback({
        referenceNumber: sendResult.referenceNumber,
        status: "SUCCESS",
        switchReferenceNumber: "SWITCH-12345",
        message: "Transaction completed successfully",
      });

      expect(callbackResult.acknowledged).toBe(true);
      expect(callbackResult.status).toBe("SUCCESS");

      // Verify status was updated
      const status = await publicCaller.switch.instapayStatus({
        referenceNumber: sendResult.referenceNumber,
      });
      expect(status.status).toBe("SUCCESS");
      expect(status.switchReferenceNumber).toBe("SWITCH-12345");
    });

    it("should reverse transaction and refund on FAILED status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Get balance before
      const accountBefore = await getAccountById(testAccountId);
      const balanceBefore = parseFloat(accountBefore?.balance || "0");

      // Create a transaction
      const sendResult = await caller.switch.instapaySend({
        sourceAccountId: testAccountId,
        bankCode: "BDO",
        bankName: "BDO Unibank",
        accountNumber: "3333333333",
        accountName: "Rosa Lim",
        amount: "1500",
      });

      // Balance should be reduced
      const accountAfterSend = await getAccountById(testAccountId);
      const balanceAfterSend = parseFloat(accountAfterSend?.balance || "0");
      expect(balanceAfterSend).toBe(balanceBefore - 1500);

      // Simulate FAILED callback from switch
      const publicCaller = appRouter.createCaller(createPublicContext());
      await publicCaller.switch.instapayCallback({
        referenceNumber: sendResult.referenceNumber,
        status: "FAILED",
        message: "Recipient account not found",
      });

      // Balance should be restored
      const accountAfterFail = await getAccountById(testAccountId);
      const balanceAfterFail = parseFloat(accountAfterFail?.balance || "0");
      expect(balanceAfterFail).toBe(balanceBefore);
    });
  });

  describe("switch.instapayList", () => {
    it("should return list of Instapay transactions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const list = await caller.switch.instapayList();

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      
      // Check first transaction has expected fields
      const tx = list[0];
      expect(tx.referenceNumber).toBeDefined();
      expect(tx.bankName).toBeDefined();
      expect(tx.accountNumber).toBeDefined();
      expect(tx.amount).toBeDefined();
      expect(tx.status).toBeDefined();
    });
  });
});
