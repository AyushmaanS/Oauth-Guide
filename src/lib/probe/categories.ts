import type { PageCategory } from "@/lib/schema/guide";

/** Light module (no server imports) so UI components can use the labels. */
/** Categories that mean "a human or an account is needed before going further". */
export const GATE_CATEGORIES: ReadonlySet<PageCategory> = new Set<PageCategory>([
  "sign_in",
  "sign_up",
  "bot_check",
  "verification_code",
  "identity_or_business_verification",
  "payment_required",
  "terms_acceptance",
  "app_review_submission",
  "invite_waitlist_or_sales",
  "region_restricted",
  "permission_denied",
]);

export const CATEGORY_TEXT: Record<PageCategory, string> = {
  public_docs: "public documentation",
  sign_in: "sign-in",
  sign_up: "account creation",
  bot_check: "bot check",
  verification_code: "email, phone or 2FA verification",
  identity_or_business_verification: "identity or business verification",
  payment_required: "payment or card",
  terms_acceptance: "terms to accept",
  app_creation_form: "app creation form",
  app_review_submission: "app review submission",
  invite_waitlist_or_sales: "invite, waitlist or contact-sales",
  region_restricted: "region restriction",
  permission_denied: "permission denied",
  not_found_or_error: "not found or error",
  unreadable_page: "unreadable page",
  other: "other",
};
