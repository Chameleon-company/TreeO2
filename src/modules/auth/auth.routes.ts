import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateMiddleware } from '../../middlewares/validate.middleware';
import { login, me } from './auth.controller';
import { loginSchema } from './auth.schemas';

const router = Router();

router.post('/login', validateMiddleware({ body: loginSchema }), login);
router.get('/me', authMiddleware, me);

export default router;
