import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getProjectsOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'projects' });
