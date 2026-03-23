import { Router } from 'express';
import { listLocalization } from './localization.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listLocalization(req, res).catch(next);
});

export default router;
