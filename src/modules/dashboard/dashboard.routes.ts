
import { Router } from 'express';
import { getTotals, getTreeCounts, getScanStats } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';


const router = Router();

router.get('/totals', authMiddleware, getTotals);
router.get('/tree-counts', authMiddleware, getTreeCounts);
router.get('/scan-stats', authMiddleware, getScanStats);

export default router;
