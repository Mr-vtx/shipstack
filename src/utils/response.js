"use strict";

// ==== Standard success response ============================================
export function success(
  reply,
  data = {},
  message = "Success",
  statusCode = 200,
) {
  return reply.code(statusCode).send({
    success: true,
    message,
    data,
  });
}

// ==== Standard error response ============================================
export function error(
  reply,
  message = "Something went wrong",
  statusCode = 400,
  details = null,
) {
  return reply.code(statusCode).send({
    success: false,
    message,
    ...(details && { details }),
  });
}

// ==== Paginated response ============================================
export function paginated(reply, { data, total, page, limit }) {
  return reply.code(200).send({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}
