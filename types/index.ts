/**
 * Shared application types.
 *
 * Data-file specific shapes (Product, Service, NavItem, ...) stay next to the
 * data that defines them. This file holds the types used across layers.
 */

/** Result shape returned by `POST /api/contact`. */
export interface ContactApiResponse {
  success: boolean;
  message: string;
  /** Only present on failures, never a stack trace. */
  error?: string;
}

/** Payload the contact form posts to the API. */
export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. Always empty for real users. */
  company?: string;
}

/** Lifecycle of the contact form. */
export type ContactFormStatus = "idle" | "sending" | "success" | "error";

/** Contact form topics offered in the category select. */
export const CONTACT_SUBJECTS = [
  "New Project",
  "Product Inquiry",
  "Partnership",
  "Support",
  "Something Else",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];
