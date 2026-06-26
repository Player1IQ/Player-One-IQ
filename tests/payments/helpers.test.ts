import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canRecordExternalPayment,
  deriveInitialPaymentStatus,
  derivePayeeFromContract,
  isTerminalPaymentStatus,
  nextStatusAfterExternalPayment,
  parseContractValueToCents,
} from "@/lib/payments/helpers";

test("parseContractValueToCents converts dollars to integer cents", () => {
  assert.equal(parseContractValueToCents(0), 0);
  assert.equal(parseContractValueToCents(1500), 150000);
  assert.equal(parseContractValueToCents(99.99), 9999);
  assert.equal(parseContractValueToCents(10.005), 1001);
  assert.equal(parseContractValueToCents(-5), 0);
  assert.equal(parseContractValueToCents(Number.NaN), 0);
});

test("derivePayeeFromContract returns creator payee", () => {
  const payee = derivePayeeFromContract({ creatorId: "creator-1" });
  assert.equal(payee.payeeType, "creator");
  assert.equal(payee.payeeCreatorId, "creator-1");
});

test("deriveInitialPaymentStatus is ready when amount positive", () => {
  assert.equal(deriveInitialPaymentStatus(0), "pending");
  assert.equal(deriveInitialPaymentStatus(100), "ready");
});

test("external payment status transitions", () => {
  assert.equal(canRecordExternalPayment("ready"), true);
  assert.equal(canRecordExternalPayment("paid_external"), false);
  assert.equal(nextStatusAfterExternalPayment("ready"), "paid_external");
  assert.equal(nextStatusAfterExternalPayment("pending"), null);
  assert.equal(isTerminalPaymentStatus("paid_external"), true);
  assert.equal(isTerminalPaymentStatus("ready"), false);
});
