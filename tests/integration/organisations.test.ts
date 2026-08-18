process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../src/app";

const TOKENS = {
	ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
};

const uniqueEmail = (): string =>
	`org-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

const createOrganisation = async (name: string) =>
	request(app)
		.post("/organisations")
		.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
		.set("Content-Type", "application/json")
		.send({ name, contactEmail: uniqueEmail() });

describe("Organisations API Integration Tests", () => {
	it("POST /organisations - should create an organisation", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({
				name: "Integration Test Organisation",
				contactEmail: uniqueEmail(),
				description: "Created by integration tests",
			});

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body).toHaveProperty("data.id");
		expect(res.body.data.accountActive).toBe(true);
	});

	it("POST /organisations - should return 400 when name is missing", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ contactEmail: uniqueEmail() });

		expect(res.status).toBe(400);
	});

	it("POST /organisations - should return 400 for an invalid email", async () => {
		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Invalid Email Org", contactEmail: "not-an-email" });

		expect(res.status).toBe(400);
	});

	it("POST /organisations - should return 409 for a duplicate contact email", async () => {
		const email = uniqueEmail();

		await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "First Organisation", contactEmail: email });

		const res = await request(app)
			.post("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ name: "Second Organisation", contactEmail: email });

		expect(res.status).toBe(409);
	});

	it("GET /organisations - should return a paginated list", async () => {
		const res = await request(app)
			.get("/organisations?page=1&limit=10")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.pagination).toHaveProperty("total");
		expect(res.body.pagination).toHaveProperty("totalPages");
	});

	it("GET /organisations - should apply default pagination values", async () => {
		const res = await request(app)
			.get("/organisations")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(res.body.pagination.page).toBe(1);
		expect(res.body.pagination.limit).toBe(10);
	});

	it("GET /organisations - should return 400 for an invalid page value", async () => {
		const res = await request(app)
			.get("/organisations?page=0")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(400);
	});

	it("GET /organisations/:id - should return the created organisation", async () => {
		const created = await createOrganisation("Fetch Me Organisation");

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
		const created = await createOrganisation("Before Update");

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ description: "Updated by integration tests" });

		expect(res.status).toBe(200);
		expect(res.body.data.description).toBe("Updated by integration tests");
	});

	it("PUT /organisations/:id - should return 400 for an empty body", async () => {
		const created = await createOrganisation("Empty Update Org");

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({});

		expect(res.status).toBe(400);
	});

	it("PUT /organisations/:id - should reject accountActive in the update body", async () => {
		const created = await createOrganisation("Cannot Deactivate By Put");

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ accountActive: false });

		expect(res.status).toBe(400);

		const fetched = await request(app)
			.get(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(fetched.body.data.accountActive).toBe(true);
	});

	it("PUT /organisations/:id - should return 409 when the organisation is deactivated", async () => {
		const created = await createOrganisation("Deactivated Then Updated");

		await request(app)
			.delete(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		const res = await request(app)
			.put(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`)
			.set("Content-Type", "application/json")
			.send({ description: "Should not be allowed" });

		expect(res.status).toBe(409);
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
		const created = await createOrganisation("Deactivate Me");

		const res = await request(app)
			.delete(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(200);
		expect(res.body.data.accountActive).toBe(false);

		const fetched = await request(app)
			.get(`/organisations/${created.body.data.id}`)
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(fetched.status).toBe(200);
		expect(fetched.body.data.accountActive).toBe(false);
	});

	it("DELETE /organisations/:id - should return 404 when not found", async () => {
		const res = await request(app)
			.delete("/organisations/999999")
			.set("Authorization", `Bearer ${TOKENS.ADMIN}`);

		expect(res.status).toBe(404);
	});
});
