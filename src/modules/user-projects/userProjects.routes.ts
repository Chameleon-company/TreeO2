import { Router } from 'express';
import { listUserProjects } from './userProjects.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listUserProjects(req, res).catch(next);
});

export default router;
