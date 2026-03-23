import { Router } from 'express';
import { listTreeTypes } from './treeTypes.controller';

const router = Router();

router.get('/', (req, res, next) => {
  void listTreeTypes(req, res).catch(next);
});

export default router;
