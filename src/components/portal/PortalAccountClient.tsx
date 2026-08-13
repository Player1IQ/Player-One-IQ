"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CreditCard, Shield, Sparkles, User } from "lucide-react";
import { ReplayOnboardingButton } from "@/components/onboarding/ReplayOnboardingButton";
import { ReplayPortalTourButton } from "@/components/onboarding/ReplayPortalTourButton";
import { ProfilePhotoUpload } from "@/components/account/ProfilePhotoUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

interface PortalAccountClientProps {
  organizationName: string;
  roleLabel: string;
  email: string;
  profileLabel: string;
  profileHref: string;
  userId: string;
  avatarUrl?: string | null;
  isWorkspaceFounder?: boolean;
}

export function PortalAccountClient({
  organizationName,
  roleLabel,
  email,
  profileLabel,
  profileHref,
  userId,
  avatarUrl,
  isWorkspaceFounder = false,
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
          <CardTitle>Your profile</CardTitle>
          <CardDescription>
            Add a photo so your agency and teammates can recognize you.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfilePhotoUpload
            userId={userId}
            displayName={email}
            email={email}
            avatarUrl={avatarUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {isWorkspaceFounder
              ? "You manage this solo creator workspace."
              : `Your portal access is managed by ${organizationName}`}
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

      {isWorkspaceFounder ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Connect your AI provider and manage your plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
            <Link
              href="/settings#ai-integration"
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition hover:border-accent/30 hover:bg-accent/5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-accent-light" />
                AI integration
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Connect OpenAI or Claude for live Coach and content analysis.
              </p>
            </Link>
            <Link
              href="/billing"
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 transition hover:border-accent/30 hover:bg-accent/5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CreditCard className="h-4 w-4 text-accent-light" />
                Billing
              </div>
              <p className="mt-2 text-xs text-gray-500">
                View your plan, trial status, and usage limits.
              </p>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <ReplayOnboardingButton />
      <ReplayPortalTourButton />
    </div>
  );
}
