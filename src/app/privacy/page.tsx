import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PRODUCT_NAME,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Player One IQ, including how we collect, use, store, and protect account and platform connection data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Introduction">
        <p>
          {LEGAL_COMPANY_NAME} (&quot;{LEGAL_PRODUCT_NAME},&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) operates {LEGAL_WEBSITE_URL} and
          related applications (the &quot;Service&quot;). This Privacy Policy
          explains how we collect, use, disclose, and protect information when
          you use the Service.
        </p>
        <p>
          By creating an account or using the Service, you agree to this Privacy
          Policy. If you do not agree, please do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>
          <strong className="text-white">Account information.</strong> When you
          register, we collect information such as your name, email address,
          organization details, role, and authentication credentials managed
          through our identity provider.
        </p>
        <p>
          <strong className="text-white">Workspace and creator data.</strong>{" "}
          You and your team may add creator profiles, sponsor information,
          contracts, opportunities, messages, schedules, deliverables, and
          related business records within your workspace.
        </p>
        <p>
          <strong className="text-white">Platform connection data.</strong> If
          you choose to connect third-party creator platforms, we may collect
          profile information, channel identifiers, analytics, revenue estimates,
          sync status, and OAuth tokens required to maintain the connection.
        </p>
        <p>
          <strong className="text-white">TikTok Login Kit data.</strong> If you
          connect TikTok, we may receive information made available through
          TikTok&apos;s APIs and the scopes you authorize, which may include
          identifiers such as open_id, username, display name, avatar URL, and
          related profile fields. We use this information only to display your
          connected account in the Service and support creator business
          management features you request.
        </p>
        <p>
          <strong className="text-white">Other connected platforms.</strong>{" "}
          Similar data may be collected when you connect YouTube, Twitch,
          Instagram, or other supported integrations.
        </p>
        <p>
          <strong className="text-white">Usage and technical data.</strong> We
          may collect log data, device/browser information, IP address,
          timestamps, and diagnostic information needed to operate, secure, and
          improve the Service.
        </p>
        <p>
          <strong className="text-white">Communications.</strong> If you contact
          us, apply to programs such as the Founding Roster, or receive support
          or product emails, we process the information you provide in those
          communications.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, operate, and maintain the Service</li>
          <li>Authenticate users and enforce workspace access controls</li>
          <li>Sync connected platform profiles, analytics, and revenue data</li>
          <li>Support contracts, opportunities, messaging, scheduling, and reporting</li>
          <li>Process subscriptions and billing where applicable</li>
          <li>Send transactional emails such as invitations and account notices</li>
          <li>Respond to support requests and founding program applications</li>
          <li>Monitor performance, troubleshoot issues, and protect against abuse</li>
          <li>Comply with legal obligations and enforce our Terms of Service</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="4. OAuth tokens and security">
        <p>
          When you connect a third-party platform, OAuth access tokens and
          related connection metadata are stored securely on our servers. These
          tokens are used only to perform the integrations you authorize, such as
          profile sync and revenue updates.
        </p>
        <p>
          OAuth tokens are not exposed through our public client APIs. Access to
          workspace data is protected by authentication, authorization, and
          database security controls, including row-level security where
          applicable.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>We may share information in the following circumstances:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Service providers.</strong> We use
            trusted vendors to host, store, email, bill, and support the
            Service. These providers process data on our behalf under contractual
            obligations.
          </li>
          <li>
            <strong className="text-white">Within your workspace.</strong>{" "}
            Information you add to a workspace may be visible to other members
            of that organization according to their assigned roles and
            permissions.
          </li>
          <li>
            <strong className="text-white">Legal and safety.</strong> We may
            disclose information if required by law, regulation, legal process, or
            to protect the rights, safety, and security of users, the public, or
            the Service.
          </li>
          <li>
            <strong className="text-white">Business transfers.</strong> If we
            are involved in a merger, acquisition, financing, or sale of assets,
            information may be transferred as part of that transaction.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Service providers and subprocessors">
        <p>
          We use third-party providers to operate the Service. Depending on your
          use of the Service, these may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase (database, authentication, and storage infrastructure)</li>
          <li>Vercel (application hosting)</li>
          <li>Resend (transactional email delivery)</li>
          <li>Stripe (subscription billing and payment processing)</li>
          <li>OpenAI or other AI providers when AI features are enabled</li>
          <li>
            Platform providers you connect, including TikTok, Google/YouTube,
            Twitch, and Meta/Instagram
          </li>
        </ul>
        <p>
          Your use of third-party platforms is also subject to those providers&apos;
          own privacy policies and terms.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          We retain information for as long as your account or workspace is
          active and as needed to provide the Service, comply with legal
          obligations, resolve disputes, and enforce our agreements.
        </p>
        <p>
          When you disconnect a platform, we stop using new data from that
          platform for future syncs. When you delete your account or request
          deletion, we delete or anonymize personal information within a
          reasonable period, except where retention is required by law or for
          legitimate business purposes such as billing records and security logs.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices and rights">
        <p>You may:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Update certain account information in your profile or settings</li>
          <li>Disconnect third-party platforms from creator settings at any time</li>
          <li>Request access, correction, or deletion of your personal information</li>
          <li>Opt out of non-essential marketing communications where offered</li>
        </ul>
        <p>
          To exercise privacy rights or submit a data request, contact us at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-accent-light hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . We may need to verify your identity before fulfilling a request.
        </p>
      </LegalSection>

      <LegalSection title="9. Children's privacy">
        <p>
          The Service is not directed to children under 13, and we do not
          knowingly collect personal information from children under 13. If you
          believe a child has provided us personal information, contact us and
          we will take appropriate steps to delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. International users">
        <p>
          If you access the Service from outside the United States, you
          understand that your information may be processed and stored in the
          United States and other countries where we or our service providers
          operate. Those locations may have different data protection laws than
          your country of residence.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will revise the &quot;Last updated&quot; date at the top of this page.
          If changes are material, we may provide additional notice through the
          Service or by email where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact us">
        <p>
          For privacy questions or requests, contact {LEGAL_COMPANY_NAME} at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-accent-light hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
