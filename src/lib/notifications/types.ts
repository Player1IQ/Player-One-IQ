export type NotificationEmailKind =
  | "deliverable_due"
  | "contract_ending"
  | "opportunity"
  | "message"
  | "weekly_brief";

export interface NotificationPreferences {
  emailDealDeadlines: boolean;
  emailNewOpportunities: boolean;
  emailNewMessages: boolean;
  emailWeeklyBrief: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  emailDealDeadlines: true,
  emailNewOpportunities: true,
  emailNewMessages: true,
  emailWeeklyBrief: true,
};

export interface NotificationRecipient {
  userId: string;
  organizationId: string;
  email: string;
}

export const MESSAGE_EMAIL_DEBOUNCE_MS = 15 * 60 * 1000;
export const OPPORTUNITY_FIT_MIN_SCORE = 3;
