import { Router } from 'express';
import { listTreeScans } from './treeScans.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listTreeScans(req, res).catch(next);
});

export default router;
