import { Router } from 'express';
import { listUsers } from './users.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listUsers(req, res).catch(next);
});

export default router;
