"use strict";

import sanitizeHtml from "sanitize-html";

// ==== Strip HTML from user input ============================================
export function sanitize(str) {
  if (!str) return str;
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim();
}

// ==== Pagination params ============================================
export function getPagination(query) {
  const page = Math.max(1, parseInt(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ==== Valid ObjectId check ============================================
export function isValidId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}
