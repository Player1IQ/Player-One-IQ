"use client";

import { Banknote } from "lucide-react";
import type { PayoutRecipient } from "@/lib/payments/types";
import { saveCreatorPayoutRecipient } from "@/app/payments/actions";
import { PayoutInstructionsForm } from "@/components/payments/PayoutSettingsSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface CreatorPortalPayoutSectionProps {
  creatorId: string;
  recipient: PayoutRecipient | null;
}

export function CreatorPortalPayoutSection({
  creatorId,
  recipient,
}: CreatorPortalPayoutSectionProps) {
  const hasInstructions = Boolean(recipient?.payoutInstructions?.trim());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Banknote className="mt-0.5 h-5 w-5 text-accent-light" />
          <div>
            <CardTitle>Payout instructions</CardTitle>
            <CardDescription>
              Wire or ACH details for completed contract payouts. Player One IQ
              does not hold funds — your organization sends payment off-platform.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasInstructions ? (
          <p className="mb-4 text-sm text-amber-200/80">
            No payout instructions on file yet. Add your bank details so your
            organization can pay you when contracts are completed.
          </p>
        ) : (
          <p className="mb-4 text-sm text-emerald-400/90">
            Instructions on file — update them here anytime.
          </p>
        )}
        <PayoutInstructionsForm
          key={recipient?.updatedAt ?? creatorId}
          initialInstructions={recipient?.payoutInstructions ?? ""}
          initialLabel={recipient?.label}
          onSave={async (instructions, label) =>
            saveCreatorPayoutRecipient({
              creatorId,
              payoutInstructions: instructions,
              label,
            })
          }
        />
      </CardContent>
    </Card>
  );
}
