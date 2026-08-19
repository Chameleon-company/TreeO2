import { describe, expect, test } from "@jest/globals";
import { canGrantRole } from "../../src/utils/roleHierarchy";

describe("canGrantRole", () => {
  test("SystemAdmin can grant lower roles", () => {
    expect(canGrantRole("SYSTEM_ADMIN", "ORGANISATION_ADMIN")).toBe(true);
    expect(canGrantRole("SYSTEM_ADMIN", "MANAGER")).toBe(true);
    expect(canGrantRole("SYSTEM_ADMIN", "INSPECTOR")).toBe(true);
    expect(canGrantRole("SYSTEM_ADMIN", "FARMER")).toBe(true);
  });

  test("OrganisationAdmin can grant roles below OrganisationAdmin", () => {
    expect(canGrantRole("ORGANISATION_ADMIN", "MANAGER")).toBe(true);
    expect(canGrantRole("ORGANISATION_ADMIN", "INSPECTOR")).toBe(true);
    expect(canGrantRole("ORGANISATION_ADMIN", "FARMER")).toBe(true);
  });

  test("Manager can grant Inspector and Farmer roles", () => {
    expect(canGrantRole("MANAGER", "INSPECTOR")).toBe(true);
    expect(canGrantRole("MANAGER", "FARMER")).toBe(true);
  });

  test("Inspector can only grant Farmer", () => {
    expect(canGrantRole("INSPECTOR", "FARMER")).toBe(true);
  });

  test("Farmer cannot grant any higher role", () => {
    expect(canGrantRole("FARMER", "INSPECTOR")).toBe(false);
    expect(canGrantRole("FARMER", "MANAGER")).toBe(false);
    expect(canGrantRole("FARMER", "ORGANISATION_ADMIN")).toBe(false);
    expect(canGrantRole("FARMER", "SYSTEM_ADMIN")).toBe(false);
  });

  test("lower roles cannot grant higher roles", () => {
    expect(canGrantRole("INSPECTOR", "MANAGER")).toBe(false);
    expect(canGrantRole("MANAGER", "ORGANISATION_ADMIN")).toBe(false);
    expect(canGrantRole("ORGANISATION_ADMIN", "SYSTEM_ADMIN")).toBe(false);
  });

  test("a role cannot grant itself", () => {
    expect(canGrantRole("SYSTEM_ADMIN", "SYSTEM_ADMIN")).toBe(false);
    expect(canGrantRole("ORGANISATION_ADMIN", "ORGANISATION_ADMIN")).toBe(false);
    expect(canGrantRole("MANAGER", "MANAGER")).toBe(false);
    expect(canGrantRole("INSPECTOR", "INSPECTOR")).toBe(false);
    expect(canGrantRole("FARMER", "FARMER")).toBe(false);
  });
});