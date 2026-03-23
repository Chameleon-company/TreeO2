import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getLocalizationOverview = async () =>
  buildModuleScaffoldResponse({ moduleName: 'localization' });
