import { afterAll, describe, expect, it } from "vitest";
import {
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@/lib/server/auth-session";
import {
  localDeleteAccount,
  localGetDataset,
  localLogin,
  localSaveDataset,
  localSignUp,
} from "@/lib/server/storage";

const createdUserIds: string[] = [];

afterAll(async () => {
  for (const id of createdUserIds) {
    await localDeleteAccount(id);
  }
});

describe("Auth Session & Password Security", () => {
  it("hashes and verifies passwords with scrypt", () => {
    const hash = hashPassword("studentPass123");
    expect(hash).toContain(":");
    expect(verifyPassword("studentPass123", hash)).toBe(true);
    expect(verifyPassword("wrongPass", hash)).toBe(false);
  });

  it("signs and verifies session tokens and rejects tampered tokens", () => {
    const token = signSessionToken({
      userId: "user-123",
      email: "test@jecrc.edu",
      mode: "local",
    });
    const decoded = verifySessionToken(token);
    expect(decoded?.userId).toBe("user-123");
    expect(decoded?.email).toBe("test@jecrc.edu");

    const tampered = `${token}x`;
    expect(verifySessionToken(tampered)).toBeNull();
  });
});

describe("Local Persistent User Storage & Isolation", () => {
  it("supports signup, login, dataset updates, and permanent deletion", async () => {
    const email = `vitest_${Date.now()}@pocketwise.test`;
    const { userId, dataset } = await localSignUp({
      fullName: "Test Student",
      email,
      password: "securePassword99",
      monthlyPocketMoney: 6000,
      savingsTarget: 1500,
    });
    createdUserIds.push(userId);

    expect(dataset.profile.monthlyPocketMoney).toBe(6000);
    expect(dataset.profile.savingsTarget).toBe(1500);

    const loginRes = await localLogin({
      email,
      password: "securePassword99",
    });
    expect(loginRes.userId).toBe(userId);

    await expect(
      localLogin({ email, password: "badPassword" })
    ).rejects.toThrow();

    const updated = await localSaveDataset(userId, {
      ...dataset,
      expenses: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          title: "Campus Canteen",
          amount: 120,
          category: "Food",
          transactionDate: "2026-11-20",
          paymentMethod: "UPI",
          createdAt: new Date().toISOString(),
        },
      ],
    });
    expect(updated.expenses).toHaveLength(1);

    const reloaded = await localGetDataset(userId);
    expect(reloaded?.expenses[0]?.title).toBe("Campus Canteen");

    await localDeleteAccount(userId);
    const afterDelete = await localGetDataset(userId);
    expect(afterDelete).toBeNull();
  });
});
