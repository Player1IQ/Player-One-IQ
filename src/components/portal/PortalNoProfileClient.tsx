"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface PortalNoProfileClientProps {
  roleLabel: string;
}

export function PortalNoProfileClient({ roleLabel }: PortalNoProfileClientProps) {
  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Portal not linked yet</CardTitle>
          <CardDescription>
            Your {roleLabel} account is active, but no roster profile is linked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-gray-400">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p>
              Ask an admin on your team to edit your role and connect you to the
              correct creator or player profile on the roster.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
