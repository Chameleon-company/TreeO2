import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getPartnersOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'partners' });
