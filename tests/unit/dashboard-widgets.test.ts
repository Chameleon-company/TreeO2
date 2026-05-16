import * as DashboardService from '../../src/modules/dashboard/dashboard.service';

describe('Dashboard Service', () => {
  const mockUser = { role: 'Admin' } as any;

  it('getTotals returns correct structure', async () => {
    const result = await DashboardService.getTotals(mockUser);
    expect(result).toHaveProperty('role', 'Admin');
  });

  it('getTreeCounts returns correct structure', async () => {
    const result = await DashboardService.getTreeCounts(mockUser);
    expect(result).toHaveProperty('role', 'Admin');
  });

  it('getScanStats returns correct structure', async () => {
    const result = await DashboardService.getScanStats(mockUser);
    expect(result).toHaveProperty('role', 'Admin');
  });
});
