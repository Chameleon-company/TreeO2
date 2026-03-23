import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getAdoptersOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'adopters' });
