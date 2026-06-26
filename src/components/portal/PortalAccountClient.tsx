"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Shield, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ReplayOnboardingButton } from "@/components/onboarding/ReplayOnboardingButton";
import { ReplayPortalTourButton } from "@/components/onboarding/ReplayPortalTourButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface PortalAccountClientProps {
  organizationName: string;
  roleLabel: string;
  email: string;
  profileLabel: string;
  profileHref: string;
}

export function PortalAccountClient({
  organizationName,
  roleLabel,
  email,
  profileLabel,
  profileHref,
}: PortalAccountClientProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portal
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Your portal access is managed by {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Signed in as</p>
            <p className="mt-1 text-sm font-medium text-white">{email}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                Organization
              </div>
              <p className="mt-1 text-sm font-medium text-white">{organizationName}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                Role
              </div>
              <p className="mt-1 text-sm font-medium text-white">{roleLabel}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
              <User className="h-3.5 w-3.5" />
              Linked profile
            </div>
            <Link
              href={profileHref}
              className="mt-1 inline-flex text-sm font-medium text-accent-light hover:text-white"
            >
              {profileLabel}
            </Link>
          </div>
        </CardContent>
      </Card>

      <ReplayOnboardingButton />
      <ReplayPortalTourButton />

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
