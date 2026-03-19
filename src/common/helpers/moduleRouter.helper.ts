import { Router } from 'express';

interface PlaceholderOptions {
  moduleName: string;
  message?: string;
}

export const createPlaceholderRouter = ({
  moduleName,
  message,
}: PlaceholderOptions): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        module: moduleName,
        status: 'scaffolded',
      },
      message: message ?? `${moduleName} module scaffold is ready for implementation.`,
    });
  });

  return router;
};
