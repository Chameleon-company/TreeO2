import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { adoptersRoutes } from '../modules/adopters';
import { adoptionsRoutes } from '../modules/adoptions';
import { dashboardRoutes } from '../modules/dashboard';
import { fobRecyclingRoutes } from '../modules/fob-recycling';
import healthRoutes from './health.routes';
import { localizationRoutes } from '../modules/localization';
import { partnersRoutes } from '../modules/partners';
import { projectsRoutes } from '../modules/projects';
import { reportsRoutes } from '../modules/reports';
import { scanBatchesRoutes } from '../modules/scan-batches';
import { treeScansRoutes } from '../modules/tree-scans';
import { treeTypesRoutes } from '../modules/tree-types';
import { userProjectsRoutes } from '../modules/user-projects';
import { usersRoutes } from '../modules/users';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/user-projects', userProjectsRoutes);
router.use('/tree-types', treeTypesRoutes);
router.use('/localization', localizationRoutes);
router.use('/scan-batches', scanBatchesRoutes);
router.use('/tree-scans', treeScansRoutes);
router.use('/fob-recycling', fobRecyclingRoutes);
router.use('/partners', partnersRoutes);
router.use('/adopters', adoptersRoutes);
router.use('/adoptions', adoptionsRoutes);
router.use('/reports', reportsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
