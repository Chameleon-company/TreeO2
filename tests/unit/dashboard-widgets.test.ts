import * as DashboardService from "../../src/modules/dashboard/dashboard.service";
import { User, UserRole } from "../../src/types";

describe("Dashboard Service", () => {
  const mockUser: User = {
    id: 1,
    name: "Test Admin",
    email: "admin@example.com",
    role: UserRole.Admin,
    card_id: null,
    account_active: true,
    can_sign_in: true,
    preferred_language: null,
    country_id: null,
    admin_location_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it("getTotals returns correct structure", async () => {
    const result = await DashboardService.getTotals(mockUser);
    expect(result).toHaveProperty("role", UserRole.Admin);
  });

  it("getTreeCounts returns correct structure", async () => {
    const result = await DashboardService.getTreeCounts(mockUser);
    expect(result).toHaveProperty("role", UserRole.Admin);
  });

  it("getScanStats returns correct structure", async () => {
    const result = await DashboardService.getScanStats(mockUser);
    expect(result).toHaveProperty("role", UserRole.Admin);
  });
});
