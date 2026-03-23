import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getTreeTypesOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'tree-types' });
