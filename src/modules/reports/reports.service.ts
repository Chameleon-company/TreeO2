import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getReportsOverview = async () =>
  buildModuleScaffoldResponse({
    moduleName: 'reports',
    message: 'Reports module scaffold is ready for async queue and storage integration.',
  });
