import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getUserProjectsOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'user-projects' });
