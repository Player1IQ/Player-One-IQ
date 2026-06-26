import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildScheduleCancellationText,
  scheduleCancellationEmailSubject,
} from "@/lib/email/schedule-invite";

test("scheduleCancellationEmailSubject includes event title", () => {
  assert.equal(
    scheduleCancellationEmailSubject("Team sync"),
    "Schedule cancelled: Team sync"
  );
});

test("buildScheduleCancellationText explains cancellation with when", () => {
  const start = new Date(2026, 5, 25, 10, 0, 0);
  const end = new Date(2026, 5, 25, 12, 0, 0);
  const text = buildScheduleCancellationText({
    to: "user@example.com",
    scheduleUrl: "https://app.example.com/schedule",
    organizationName: "Acme Agency",
    eventTitle: "Team sync",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    location: "Zoom",
  });

  assert.match(text, /has been cancelled/);
  assert.match(text, /Team sync/);
  assert.match(text, /June 25/);
  assert.match(text, /Location: Zoom/);
  assert.match(text, /https:\/\/app\.example\.com\/schedule/);
});
