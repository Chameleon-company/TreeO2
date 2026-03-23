import { Router } from 'express';
import { listFobRecycling } from './fobRecycling.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listFobRecycling(req, res).catch(next);
});

export default router;
