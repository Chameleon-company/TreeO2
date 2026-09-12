import { describe, expect, test } from "@jest/globals";
import { canGrantRole } from "../../src/utils/roleHierarchy";

describe("canGrantRole", () => {
	test("SystemAdmin can grant any role", () => {
		expect(canGrantRole("SYSTEM_ADMIN", "SYSTEM_ADMIN")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "SUPPORT_ADMIN")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "READ_ONLY")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "ORGANISATION_ADMIN")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "MEMBER")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "MANAGER")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "INSPECTOR")).toBe(true);
		expect(canGrantRole("SYSTEM_ADMIN", "FARMER")).toBe(true);
	});

	test("OrganisationAdmin can grant Member, Manager, Inspector and Farmer", () => {
		expect(canGrantRole("ORGANISATION_ADMIN", "MEMBER")).toBe(true);
		expect(canGrantRole("ORGANISATION_ADMIN", "MANAGER")).toBe(true);
		expect(canGrantRole("ORGANISATION_ADMIN", "INSPECTOR")).toBe(true);
		expect(canGrantRole("ORGANISATION_ADMIN", "FARMER")).toBe(true);
	});

	test("OrganisationAdmin cannot grant system roles or itself", () => {
		expect(canGrantRole("ORGANISATION_ADMIN", "ORGANISATION_ADMIN")).toBe(
			false,
		);
		expect(canGrantRole("ORGANISATION_ADMIN", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("ORGANISATION_ADMIN", "SUPPORT_ADMIN")).toBe(false);
		expect(canGrantRole("ORGANISATION_ADMIN", "READ_ONLY")).toBe(false);
	});

	test("Member cannot grant any role", () => {
		expect(canGrantRole("MEMBER", "MEMBER")).toBe(false);
		expect(canGrantRole("MEMBER", "MANAGER")).toBe(false);
		expect(canGrantRole("MEMBER", "INSPECTOR")).toBe(false);
		expect(canGrantRole("MEMBER", "FARMER")).toBe(false);
		expect(canGrantRole("MEMBER", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("MEMBER", "SYSTEM_ADMIN")).toBe(false);
	});

	test("Manager can grant Inspector and Farmer", () => {
		expect(canGrantRole("MANAGER", "INSPECTOR")).toBe(true);
		expect(canGrantRole("MANAGER", "FARMER")).toBe(true);
	});

	test("Manager cannot grant Manager or higher roles", () => {
		expect(canGrantRole("MANAGER", "MANAGER")).toBe(false);
		expect(canGrantRole("MANAGER", "MEMBER")).toBe(false);
		expect(canGrantRole("MANAGER", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("MANAGER", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("MANAGER", "SUPPORT_ADMIN")).toBe(false);
		expect(canGrantRole("MANAGER", "READ_ONLY")).toBe(false);
	});

	test("Inspector cannot grant any role", () => {
		expect(canGrantRole("INSPECTOR", "FARMER")).toBe(false);
		expect(canGrantRole("INSPECTOR", "INSPECTOR")).toBe(false);
		expect(canGrantRole("INSPECTOR", "MANAGER")).toBe(false);
		expect(canGrantRole("INSPECTOR", "MEMBER")).toBe(false);
		expect(canGrantRole("INSPECTOR", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("INSPECTOR", "SYSTEM_ADMIN")).toBe(false);
	});

	test("Farmer cannot grant any role", () => {
		expect(canGrantRole("FARMER", "FARMER")).toBe(false);
		expect(canGrantRole("FARMER", "INSPECTOR")).toBe(false);
		expect(canGrantRole("FARMER", "MANAGER")).toBe(false);
		expect(canGrantRole("FARMER", "MEMBER")).toBe(false);
		expect(canGrantRole("FARMER", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("FARMER", "SYSTEM_ADMIN")).toBe(false);
	});

	test("SupportAdmin cannot grant roles", () => {
		expect(canGrantRole("SUPPORT_ADMIN", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("SUPPORT_ADMIN", "SUPPORT_ADMIN")).toBe(false);
		expect(canGrantRole("SUPPORT_ADMIN", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("SUPPORT_ADMIN", "MANAGER")).toBe(false);
		expect(canGrantRole("SUPPORT_ADMIN", "INSPECTOR")).toBe(false);
		expect(canGrantRole("SUPPORT_ADMIN", "FARMER")).toBe(false);
	});

	test("ReadOnly cannot grant roles", () => {
		expect(canGrantRole("READ_ONLY", "SYSTEM_ADMIN")).toBe(false);
		expect(canGrantRole("READ_ONLY", "READ_ONLY")).toBe(false);
		expect(canGrantRole("READ_ONLY", "ORGANISATION_ADMIN")).toBe(false);
		expect(canGrantRole("READ_ONLY", "MANAGER")).toBe(false);
		expect(canGrantRole("READ_ONLY", "INSPECTOR")).toBe(false);
		expect(canGrantRole("READ_ONLY", "FARMER")).toBe(false);
	});
});
