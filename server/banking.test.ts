import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin-user",
    email: "admin@secbank.com",
    name: "Test Admin",
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

describe("Banking API Routes", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  describe("branch routes", () => {
    it("should list branches", async () => {
      const branches = await caller.branch.list();
      expect(Array.isArray(branches)).toBe(true);
    });

    it("should seed default branches", async () => {
      const result = await caller.branch.seed();
      expect(result.success).toBe(true);
    });
  });

  describe("customer routes", () => {
    it("should list customers", async () => {
      const customers = await caller.customer.list();
      expect(Array.isArray(customers)).toBe(true);
    });

    it("should create a customer", async () => {
      const customer = await caller.customer.create({ name: "Test Customer" });
      expect(customer).toBeDefined();
      expect(customer?.name).toBe("Test Customer");
    });
  });

  describe("account routes", () => {
    it("should list accounts", async () => {
      const accounts = await caller.account.list();
      expect(Array.isArray(accounts)).toBe(true);
    });
  });

  describe("transaction routes", () => {
    it("should list transactions", async () => {
      const transactions = await caller.transaction.list();
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe("dashboard routes", () => {
    it("should return dashboard stats", async () => {
      const stats = await caller.dashboard.stats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalCustomers).toBe("number");
      expect(typeof stats.totalAccounts).toBe("number");
      expect(stats.totalBalance).toBeDefined();
      expect(Array.isArray(stats.branchBalances)).toBe(true);
      expect(stats.todayTransactions).toBeDefined();
    });
  });
});
