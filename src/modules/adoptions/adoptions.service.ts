import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getAdoptionsOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'adoptions' });
