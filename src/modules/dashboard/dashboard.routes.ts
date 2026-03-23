import { Router } from 'express';
import { getDashboard } from './dashboard.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void getDashboard(req, res).catch(next);
});

export default router;
