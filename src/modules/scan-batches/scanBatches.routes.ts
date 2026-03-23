import { Router } from 'express';
import { listScanBatches } from './scanBatches.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listScanBatches(req, res).catch(next);
});

export default router;
