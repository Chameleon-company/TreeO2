import { Router } from 'express';
import { listPartners } from './partners.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listPartners(req, res).catch(next);
});

export default router;
