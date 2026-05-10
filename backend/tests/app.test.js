const request = require("supertest");
const app = require("../src/app");

describe("App entrypoints", () => {
  it("returns service metadata for the root URL", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.health).toBe("/health");
  });

  it("does not crash when query params need sanitizing", async () => {
    const res = await request(app).get("/api/v1/analytics/daily?page[$gt]=1");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized");
  });
});
