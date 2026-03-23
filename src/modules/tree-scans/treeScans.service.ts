import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getTreeScansOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'tree-scans' });
