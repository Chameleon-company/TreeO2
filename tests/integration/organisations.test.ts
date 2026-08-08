process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../src/app";

const TOKENS = {
	ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
	MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
};

const uniqueEmail = (): string =>
	`org-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

describe("Organisations API Integration Tests", () => {
	it("POST /organisations - should create an organisation", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({
				name: "Integration Test Organisation",
				contact_email: uniqueEmail(),
				description: "Created by integration tests",
			});

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body).toHaveProperty("data.id");
		expect(res.body.data.account_active).toBe(true);
	});

	it("POST /organisations - should return 400 when name is missing", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ contact_email: uniqueEmail() });

		expect(res.status).toBe(400);
	});

	it("POST /organisations - should return 400 for an invalid email", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Invalid Email Org", contact_email: "not-an-email" });

		expect(res.status).toBe(400);
	});

	it("POST /organisations - should return 401 when no token is supplied", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Content-Type", "application/json")
			.send({ name: "No Token Org" });

		expect(res.status).toBe(401);
	});

	it("GET /organisations - should return a paginated list", async () => {
		const res = await request(app)
			.get("/organisations?page=1&limit=10")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.pagination).toHaveProperty("total");
		expect(res.body.pagination).toHaveProperty("totalPages");
	});

	it("GET /organisations - MANAGER should be able to access the list", async () => {
		const res = await request(app)
			.get("/organisations")
			.set("Authorization", `Bearer ${TOKENS.MANAGER}`);

		expect(res.status).toBe(200);
	});

	it("GET /organisations/:id - should return the created organisation", async () => {
		const created = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Fetch Me Organisation", contact_email: uniqueEmail() });

		const res = await request(app)
			.get(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(res.body.data.name).toBe("Fetch Me Organisation");
	});

	it("GET /organisations/:id - should return 404 when not found", async () => {
		const res = await request(app)
			.get("/organisations/999999")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(404);
	});

	it("PUT /organisations/:id - should update an organisation", async () => {
		const created = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Before Update", contact_email: uniqueEmail() });

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ description: "Updated by integration tests" });

		expect(res.status).toBe(200);
		expect(res.body.data.description).toBe("Updated by integration tests");
	});

	it("PUT /organisations/:id - should return 400 for an empty body", async () => {
		const created = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Empty Update Org", contact_email: uniqueEmail() });

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({});

		expect(res.status).toBe(400);
	});

	it("PUT /organisations/:id - should return 404 when not found", async () => {
		const res = await request(app)
			.put("/organisations/999999")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ description: "Does not exist" });

		expect(res.status).toBe(404);
	});

	it("DELETE /organisations/:id - should deactivate rather than remove", async () => {
		const created = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Deactivate Me", contact_email: uniqueEmail() });

		const res = await request(app)
			.delete(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(res.body.data.account_active).toBe(false);

		const fetched = await request(app)
			.get(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(fetched.status).toBe(200);
		expect(fetched.body.data.account_active).toBe(false);
	});

	it("DELETE /organisations/:id - should return 404 when not found", async () => {
		const res = await request(app)
			.delete("/organisations/999999")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(404);
	});
});
