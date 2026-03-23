import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getDashboardOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'dashboard' });
