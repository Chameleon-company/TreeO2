import { Router } from 'express';
import { listProjects } from './projects.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listProjects(req, res).catch(next);
});

export default router;
