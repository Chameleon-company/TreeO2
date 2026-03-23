import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateMiddleware } from '../../middlewares/validate.middleware';
import { login, me } from './auth.controller';
import { loginSchema } from './auth.schemas';

const router = Router();

router.post('/login', validateMiddleware({ body: loginSchema }), (req, res, next) => {
  void login(req, res).catch(next);
});

router.get('/me', authMiddleware, (req, res, next) => {
  void me(req, res).catch(next);
});

export default router;
