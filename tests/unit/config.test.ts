describe("CORS_ORIGIN configuration", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
		};
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	it("should parse wildcard origin as a string", async () => {
		process.env.CORS_ORIGIN = "*";

		const { env } = await import("../../src/config/env");

		expect(env.CORS_ORIGIN).toBe("*");
	});

	it("should parse a single origin as an array", async () => {
		process.env.CORS_ORIGIN = "http://localhost:3000";

		const { env } = await import("../../src/config/env");

		expect(env.CORS_ORIGIN).toEqual(["http://localhost:3000"]);
	});

	it("should parse multiple origins as an array", async () => {
		process.env.CORS_ORIGIN = "http://localhost:3000,http://localhost:5173";

		const { env } = await import("../../src/config/env");

		expect(env.CORS_ORIGIN).toEqual([
			"http://localhost:3000",
			"http://localhost:5173",
		]);
	});
});
