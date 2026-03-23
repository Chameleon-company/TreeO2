import { Router } from 'express';
import { listReports } from './reports.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listReports(req, res).catch(next);
});

export default router;
