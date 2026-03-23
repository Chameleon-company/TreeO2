import { Router } from 'express';
import { listAdopters } from './adopters.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listAdopters(req, res).catch(next);
});

export default router;
