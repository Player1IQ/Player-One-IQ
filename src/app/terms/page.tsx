import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PRODUCT_NAME,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Player One IQ, the operating system for creator business management.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <LegalSection title="1. Agreement to terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of {LEGAL_WEBSITE_URL}, related applications, and services
          provided by {LEGAL_COMPANY_NAME} (&quot;{LEGAL_PRODUCT_NAME},&quot;
          &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) (collectively, the
          &quot;Service&quot;).
        </p>
        <p>
          By creating an account, accessing, or using the Service, you agree to
          these Terms and our Privacy Policy. If you are using the Service on
          behalf of an organization, you represent that you have authority to
          bind that organization to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of the Service">
        <p>
          {LEGAL_PRODUCT_NAME} provides software for creators, agencies, and
          organizations to manage creator business operations, including
          analytics, revenue tracking, contracts, partnerships, team
          collaboration, messaging, scheduling, and related workflows.
        </p>
        <p>
          The Service may include optional integrations with third-party
          platforms such as TikTok, YouTube, Twitch, and Instagram. Features may
          vary by plan, role, and program access level.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority in your
          jurisdiction, to use the Service. If you are under 18, you may use the
          Service only with involvement and consent of a parent or legal guardian
          who accepts these Terms on your behalf.
        </p>
        <p>
          You may not use the Service if you are prohibited from doing so under
          applicable law or the terms of a third-party platform you connect.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts and security">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity that occurs under your account. You
          agree to provide accurate information and keep your account details
          current.
        </p>
        <p>
          You must notify us promptly at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-accent-light hover:underline"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          if you believe your account has been compromised.
        </p>
      </LegalSection>

      <LegalSection title="5. Connected platforms">
        <p>
          If you connect third-party platforms to the Service, you authorize us
          to access and use information from those platforms as needed to
          provide the requested features. You represent that you have the right
          to connect each account and that your use complies with the applicable
          platform&apos;s terms and policies.
        </p>
        <p>
          For TikTok Login Kit and other OAuth integrations, you remain subject
          to the third party&apos;s developer terms, community guidelines, and
          privacy policies. We do not control third-party platforms and are not
          responsible for their availability, policies, or actions.
        </p>
        <p>
          You may disconnect a platform at any time through the Service, subject
          to any data retention described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
          <li>Violate any applicable law, regulation, or third-party rights</li>
          <li>Attempt to gain unauthorized access to the Service or other accounts</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Reverse engineer or attempt to extract source code except as permitted by law</li>
          <li>Upload malware or use the Service to send spam or abusive content</li>
          <li>Misrepresent your identity, affiliation, or authority over any connected account</li>
          <li>Use the Service to scrape or collect data outside authorized integrations</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Founding, beta, and early access">
        <p>
          From time to time, we may offer founding, beta, early access, or
          preview programs. These programs may include limited availability,
          changing features, and direct feedback expectations.
        </p>
        <p>
          Early access features are provided for evaluation and improvement
          purposes. We may modify, suspend, or discontinue any feature at any
          time, especially during pre-launch or founding periods.
        </p>
      </LegalSection>

      <LegalSection title="8. Subscriptions and billing">
        <p>
          Paid plans, trials, and billing terms are presented at checkout or in
          the Service. By subscribing, you authorize us and our payment
          processor to charge applicable fees according to the selected plan.
        </p>
        <p>
          Fees are generally non-refundable except where required by law or
          expressly stated otherwise. You are responsible for applicable taxes.
          We may change pricing or plan features with notice where required.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual property">
        <p>
          The Service, including its software, design, branding, and
          documentation, is owned by {LEGAL_COMPANY_NAME} or its licensors and is
          protected by intellectual property laws. Except for the limited rights
          expressly granted in these Terms, no rights are transferred to you.
        </p>
        <p>
          You retain ownership of content and data you submit to the Service. You
          grant us a limited license to host, process, display, and use that
          content solely to operate and improve the Service.
        </p>
      </LegalSection>

      <LegalSection title="10. Confidentiality and feedback">
        <p>
          If you participate in founding or early access programs, you may
          receive access to non-public features or information. You agree not to
          misuse confidential information made available to you through those
          programs.
        </p>
        <p>
          If you provide feedback, suggestions, or ideas, you grant us the right
          to use them without restriction or compensation.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
          DISCLAIM ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          We do not guarantee that the Service will be uninterrupted, secure, or
          error-free, or that integrations with third-party platforms will
          always be available or accurate.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL_COMPANY_NAME} AND ITS
          AFFILIATES, OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM OR
          RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE
          SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN
          THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM OR
          (B) ONE HUNDRED U.S. DOLLARS (US $100), EXCEPT WHERE LIABILITY CANNOT
          BE LIMITED BY LAW.
        </p>
      </LegalSection>

      <LegalSection title="13. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless {LEGAL_COMPANY_NAME}
          and its affiliates, officers, employees, and agents from claims,
          damages, losses, and expenses (including reasonable attorneys&apos;
          fees) arising from your use of the Service, your content, your
          connected accounts, or your violation of these Terms or applicable
          law.
        </p>
      </LegalSection>

      <LegalSection title="14. Suspension and termination">
        <p>
          We may suspend or terminate your access to the Service if you violate
          these Terms, create risk or legal exposure for us, or if we
          discontinue the Service. You may stop using the Service at any time.
        </p>
        <p>
          Upon termination, your right to access the Service ends. Sections
          that by their nature should survive termination will survive,
          including intellectual property, disclaimers, limitation of liability,
          and indemnification.
        </p>
      </LegalSection>

      <LegalSection title="15. Governing law">
        <p>
          These Terms are governed by the laws of the State of Delaware, United
          States, without regard to conflict of law principles, except where
          mandatory local law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection title="16. Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we do, we will
          revise the &quot;Last updated&quot; date at the top of this page. If
          changes are material, we may provide additional notice through the
          Service or by email where appropriate. Continued use of the Service
          after changes become effective constitutes acceptance of the revised
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="17. Contact">
        <p>
          Questions about these Terms may be sent to {LEGAL_COMPANY_NAME} at{" "}
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
