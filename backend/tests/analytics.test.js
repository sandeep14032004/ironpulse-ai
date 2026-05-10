const request = require("supertest");
const app = require("../src/app");

describe("Analytics endpoints", () => {
  it("requires auth for daily analytics", async () => {
    const res = await request(app).get("/api/v1/analytics/daily");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
