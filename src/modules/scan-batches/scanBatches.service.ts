import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getScanBatchesOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'scan-batches' });
