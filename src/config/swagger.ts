import type { JsonObject } from "swagger-ui-express";

export const swaggerSpec: JsonObject = {
  openapi: "3.0.0",
  info: {
    title: "Zorvyn Financial API",
    version: "1.0.0",
    description:
      "A secure, role-based financial management REST API. Supports JWT cookie authentication, RBAC (Admin / Analyst / Viewer), CRUD operations on financial records, and analytical dashboard endpoints.",
    contact: { name: "Zorvyn Team" },
  },
  servers: [
    {
      url: "https://zorvyn-puce.vercel.app",
      description: "Production server",
    },
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication & session management" },
    { name: "Users", description: "User management (Admin only)" },
    { name: "Records", description: "Financial record CRUD operations" },
    { name: "Dashboard", description: "Analytical & aggregation endpoints" },
    { name: "Health", description: "Server health check" },
  ],

  // ═══════════════════════════════════════════════════════
  //  PATHS
  // ═══════════════════════════════════════════════════════
  paths: {
    // ── Auth ────────────────────────────────────────────
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        description: "Creates a new user account. Any role (VIEWER, ANALYST, ADMIN) can be self-assigned via the optional 'role' field for ease of testing. Defaults to VIEWER if omitted. In a production environment, self-registration would be restricted to VIEWER only.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterBody" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully. Auth cookies are set automatically.",
            headers: {
              "Set-Cookie": {
                description: "accessToken and refreshToken HTTP-only cookies",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User registered successfully" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { $ref: "#/components/schemas/Role" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Email already in use or validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        summary: "Log in with email and password",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginBody" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful. Auth cookies are set automatically.",
            headers: {
              "Set-Cookie": {
                description: "accessToken and refreshToken HTTP-only cookies",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Login successful" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { $ref: "#/components/schemas/Role" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          403: {
            description: "Account is inactive",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        summary: "Log out and revoke the refresh token",
        tags: ["Auth"],
        responses: {
          200: {
            description: "Logged out successfully. Auth cookies are cleared.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Logged out successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Users ───────────────────────────────────────────
    "/api/users": {
      get: {
        summary: "List all users (paginated)",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", default: 1 }, description: "Page number" },
          { in: "query", name: "limit", schema: { type: "integer", default: 10, maximum: 100 }, description: "Items per page (max 100)" },
        ],
        responses: {
          200: {
            description: "Paginated list of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/UserSafe" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden – Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/users/{id}/role": {
      put: {
        summary: "Update a user's role",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRoleBody" } } },
        },
        responses: {
          200: {
            description: "Role updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User role updated" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        email: { type: "string" },
                        role: { $ref: "#/components/schemas/Role" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/users/{id}/status": {
      put: {
        summary: "Activate or deactivate a user",
        tags: ["Users"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStatusBody" } } },
        },
        responses: {
          200: {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "User status updated" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        email: { type: "string" },
                        status: { $ref: "#/components/schemas/Status" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Records ─────────────────────────────────────────
    "/api/records": {
      get: {
        summary: "List financial records (paginated, filterable)",
        tags: ["Records"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", default: 1 }, description: "Page number" },
          { in: "query", name: "limit", schema: { type: "integer", default: 10, maximum: 100 }, description: "Items per page (max 100)" },
          { in: "query", name: "type", schema: { $ref: "#/components/schemas/RecordType" }, description: "Filter by INCOME or EXPENSE" },
          { in: "query", name: "category", schema: { type: "string" }, description: "Filter by category name" },
        ],
        responses: {
          200: {
            description: "Paginated list of financial records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/FinancialRecord" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden – Analyst or Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        summary: "Create a new financial record",
        tags: ["Records"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRecordBody" } } },
        },
        responses: {
          201: {
            description: "Record created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Record created" },
                    record: { $ref: "#/components/schemas/FinancialRecord" },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden – Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/records/{id}": {
      get: {
        summary: "Get a single financial record by ID",
        tags: ["Records"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Record ID" },
        ],
        responses: {
          200: {
            description: "The requested financial record",
            content: { "application/json": { schema: { $ref: "#/components/schemas/FinancialRecord" } } },
          },
          404: { description: "Record not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      put: {
        summary: "Update an existing financial record",
        tags: ["Records"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Record ID" },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRecordBody" } } },
        },
        responses: {
          200: {
            description: "Record updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Record updated" },
                    record: { $ref: "#/components/schemas/FinancialRecord" },
                  },
                },
              },
            },
          },
          404: { description: "Record not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        summary: "Soft-delete a financial record",
        description: "Sets deletedAt timestamp instead of permanently removing the record.",
        tags: ["Records"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Record ID" },
        ],
        responses: {
          200: {
            description: "Record soft-deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Record deleted" },
                  },
                },
              },
            },
          },
          404: { description: "Record not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Dashboard ───────────────────────────────────────
    "/api/dashboard/summary": {
      get: {
        summary: "Get income / expense / net balance totals",
        tags: ["Dashboard"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Aggregated financial summary",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SummaryResponse" } } },
          },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden – Analyst or Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/dashboard/category-totals": {
      get: {
        summary: "Get totals grouped by category and type",
        tags: ["Dashboard"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Array of category / type totals",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/CategoryTotal" } },
              },
            },
          },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden – Analyst or Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/dashboard/trends": {
      get: {
        summary: "Get monthly income & expense trends",
        description: "Returns an object keyed by month (YYYY-MM) with income and expense totals for each month.",
        tags: ["Dashboard"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Monthly trends object",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TrendsResponse" } } },
          },
          401: { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Forbidden – Analyst or Admin role required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    // ── Health ──────────────────────────────────────────
    "/api/health": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          200: {
            description: "Server is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: { type: "string", example: "Zorvyn assessment API is running." },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════
  //  COMPONENTS
  // ═══════════════════════════════════════════════════════
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description: "JWT access token stored as an HTTP-only cookie. Obtain one by calling POST /api/auth/login.",
      },
    },
    schemas: {
      // ── Enums ──────────────────────────────────────────
      Role: { type: "string", enum: ["VIEWER", "ANALYST", "ADMIN"] },
      Status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
      RecordType: { type: "string", enum: ["INCOME", "EXPENSE"] },

      // ── Request bodies ─────────────────────────────────
      RegisterBody: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
          name: { type: "string", example: "John Doe" },
          role: { $ref: "#/components/schemas/Role" },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", example: "secret123" },
        },
      },
      CreateRecordBody: {
        type: "object",
        required: ["amount", "type", "category"],
        properties: {
          amount: { type: "number", example: 2500.0 },
          type: { $ref: "#/components/schemas/RecordType" },
          category: { type: "string", example: "Salary" },
          notes: { type: "string", example: "April pay-check" },
          date: { type: "string", format: "date-time", example: "2026-04-01T00:00:00.000Z" },
        },
      },
      UpdateRoleBody: {
        type: "object",
        required: ["role"],
        properties: { role: { $ref: "#/components/schemas/Role" } },
      },
      UpdateStatusBody: {
        type: "object",
        required: ["status"],
        properties: { status: { $ref: "#/components/schemas/Status" } },
      },

      // ── Response models ────────────────────────────────
      UserSafe: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", example: "john@example.com" },
          name: { type: "string", example: "John Doe" },
          role: { $ref: "#/components/schemas/Role" },
          status: { $ref: "#/components/schemas/Status" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      FinancialRecord: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          amount: { type: "number", example: 2500.0 },
          type: { $ref: "#/components/schemas/RecordType" },
          category: { type: "string", example: "Salary" },
          date: { type: "string", format: "date-time" },
          notes: { type: "string", nullable: true, example: "April pay-check" },
          userId: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "boolean", example: true },
          message: { type: "string", example: "Something went wrong" },
        },
      },
      SummaryResponse: {
        type: "object",
        properties: {
          totalIncome: { type: "number", example: 50000 },
          totalExpenses: { type: "number", example: 32000 },
          netBalance: { type: "number", example: 18000 },
        },
      },
      CategoryTotal: {
        type: "object",
        properties: {
          category: { type: "string", example: "Salary" },
          type: { $ref: "#/components/schemas/RecordType" },
          total: { type: "number", example: 25000 },
        },
      },
      TrendsResponse: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            income: { type: "number" },
            expense: { type: "number" },
          },
        },
        example: {
          "2026-01": { income: 5000, expense: 3200 },
          "2026-02": { income: 4800, expense: 2900 },
        },
      },
    },
  },
};
