import { buildModuleScaffoldResponse } from '../../common/helpers/moduleRouter.helper';

export const getUsersOverview = async () =>
  buildModuleScaffoldResponse({
    moduleName: 'users',
    message: 'Users module scaffold is ready for controllers, services, and Prisma queries.',
  });
