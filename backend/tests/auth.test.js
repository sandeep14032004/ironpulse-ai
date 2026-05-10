const request = require("supertest");
const app = require("../src/app");

describe("Auth endpoints", () => {
  it("returns structured response for register validation errors", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({});
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
