const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IronPulse AI API",
      version: "1.0.0",
      description: "Production API for fitness tracking, analytics, progression, and authentication.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Auth" },
      { name: "Workouts" },
      { name: "Analytics" },
      { name: "Progression" },
      { name: "Bodyweight" },
      { name: "Notifications" },
      { name: "Dashboard" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        StandardSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Request successful" },
            data: { type: "object" },
            meta: { type: "object" },
          },
        },
        StandardError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    paths: {
      "/api/v1/auth/register": { post: { tags: ["Auth"], summary: "Register user", responses: { 201: { description: "Created" } } } },
      "/api/v1/auth/login": { post: { tags: ["Auth"], summary: "Login user", responses: { 200: { description: "OK" } } } },
      "/api/v1/auth/refresh": { post: { tags: ["Auth"], summary: "Rotate refresh token", responses: { 200: { description: "OK" } } } },
      "/api/v1/auth/logout": { post: { tags: ["Auth"], summary: "Invalidate refresh token", responses: { 200: { description: "OK" } } } },
      "/api/v1/workouts/today": { get: { tags: ["Workouts"], security: [{ bearerAuth: [] }], summary: "Get today plan", responses: { 200: { description: "OK" } } } },
      "/api/v1/workouts/start": { post: { tags: ["Workouts"], security: [{ bearerAuth: [] }], summary: "Start workout", responses: { 201: { description: "Created" } } } },
      "/api/v1/workouts/complete-set": { post: { tags: ["Workouts"], security: [{ bearerAuth: [] }], summary: "Complete workout set", responses: { 200: { description: "OK" } } } },
      "/api/v1/workouts/finish": { post: { tags: ["Workouts"], security: [{ bearerAuth: [] }], summary: "Finish workout", responses: { 200: { description: "OK" } } } },
      "/api/v1/analytics/daily": { get: { tags: ["Analytics"], security: [{ bearerAuth: [] }], summary: "Daily analytics", responses: { 200: { description: "OK" } } } },
      "/api/v1/analytics/weekly": { get: { tags: ["Analytics"], security: [{ bearerAuth: [] }], summary: "Weekly analytics", responses: { 200: { description: "OK" } } } },
      "/api/v1/analytics/monthly": { get: { tags: ["Analytics"], security: [{ bearerAuth: [] }], summary: "Monthly analytics", responses: { 200: { description: "OK" } } } },
      "/api/v1/progression/current": { get: { tags: ["Progression"], security: [{ bearerAuth: [] }], summary: "Current progression", responses: { 200: { description: "OK" } } } },
      "/api/v1/bodyweight": { post: { tags: ["Bodyweight"], security: [{ bearerAuth: [] }], summary: "Add bodyweight entry", responses: { 201: { description: "Created" } } } },
      "/api/v1/bodyweight/history": { get: { tags: ["Bodyweight"], security: [{ bearerAuth: [] }], summary: "Bodyweight history", responses: { 200: { description: "OK" } } } },
      "/api/v1/notifications/motivation": { get: { tags: ["Notifications"], security: [{ bearerAuth: [] }], summary: "Motivational message", responses: { 200: { description: "OK" } } } },
      "/api/v1/dashboard": { get: { tags: ["Dashboard"], security: [{ bearerAuth: [] }], summary: "Dashboard payload", responses: { 200: { description: "OK" } } } },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJSDoc(options);
