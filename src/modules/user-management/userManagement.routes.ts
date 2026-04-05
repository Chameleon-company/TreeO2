import { Router } from 'express';
import { UserManagementController } from './userManagement.controller';

const router = Router();

router.get('/users', UserManagementController.getUsers);
router.get('/users/:id', UserManagementController.getUserById);
router.post('/users', UserManagementController.createUser);
router.put('/users/:id', UserManagementController.updateUser);
router.delete('/users/:id', UserManagementController.deleteUser);

export default router;