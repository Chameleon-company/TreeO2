import { describe, expect, test } from "@jest/globals";
import { canGrantRole } from "../../src/utils/roleHierarchy";

describe("canGrantRole", () => {
	test("SystemAdmin can grant any role", () => {
		expect(canGrantRole("SYSTEM_ADMIN", "SYSTEM_ADMIN")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "ORGANISATION_ADMIN")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "MANAGER")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "INSPECTOR")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "FARMER")).toBe(true);
	});

	test("OrganisationAdmin can grant Manager, Inspector and Farmer", () => {
		expect(canGrantRole("ORGANISATION_ADMIN", "MANAGER")).toBe(true);
		expect(canGrantRole("ORGANISATION_ADMIN", "INSPECTOR")).toBe(true);
		expect(canGrantRole("ORGANISATION_ADMIN", "FARMER")).toBe(true);
	});

	test("OrganisationAdmin cannot grant OrganisationAdmin or SystemAdmin", () => {
		expect(canGrantRole("ORGANISATION_ADMIN", "ORGANISATION_ADMIN")).toBe(
			false,
		);
		expect(canGrantRole("ORGANISATION_ADMIN", "SYSTEM_ADMIN")).toBe(false);
	});

	test("Manager can grant Inspector and Farmer", () => {
		expect(canGrantRole("MANAGER", "INSPECTOR")).toBe(true);
		expect(canGrantRole("MANAGER", "FARMER")).toBe(true);
	});

	test("Manager cannot grant Manager or higher roles", () => {
		expect(canGrantRole("MANAGER", "MANAGER")).toBe(false);
		expect(canGrantRole("MANAGER", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("MANAGER", "SYSTEM_ADMIN")).toBe(false);
	});

	test("Inspector cannot grant any role", () => {
		expect(canGrantRole("INSPECTOR", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("INSPECTOR", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("INSPECTOR", "MANAGER")).toBe(false);
		expect(canGrantRole("INSPECTOR", "INSPECTOR")).toBe(false);
		expect(canGrantRole("INSPECTOR", "FARMER")).toBe(false);
	});

	test("Farmer cannot grant any role", () => {
		expect(canGrantRole("FARMER", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("FARMER", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("FARMER", "MANAGER")).toBe(false);
		expect(canGrantRole("FARMER", "INSPECTOR")).toBe(false);
		expect(canGrantRole("FARMER", "FARMER")).toBe(false);
	});
});
