import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getFobRecyclingOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'fob-recycling' });
