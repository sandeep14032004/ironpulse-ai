const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");

describe("Auth endpoints", () => {
  it("returns structured response for register validation errors", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({});
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("returns unauthorized instead of server error for expired access tokens", async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-access-secret";
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, { expiresIn: "-1s" });

    const res = await request(app).get("/api/v1/auth/profile").set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token expired");
  });
});
