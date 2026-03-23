import { Router } from 'express';
import { listAdoptions } from './adoptions.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listAdoptions(req, res).catch(next);
});

export default router;
