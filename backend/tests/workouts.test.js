const request = require("supertest");
const app = require("../src/app");

describe("Workout endpoints", () => {
  it("requires auth for workout today", async () => {
    const res = await request(app).get("/api/v1/workouts/today");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
