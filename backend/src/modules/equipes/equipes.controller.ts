import express from 'express';
import { EquipesService } from './equipes.service';
import { SqlitePersistence } from '../../database/SqlitePersistence';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = express.Router();
const service = new EquipesService();

router.get('/', asyncHandler(async (req, res) => {
  const result = await service.listar();
  res.json(result);
}));

router.get('/usuarios', asyncHandler(async (req, res) => {
  const usersPersistence = new SqlitePersistence<{ id: string; email: string; role: string; level: number }>('users');
  const users = usersPersistence.getAll().map(u => ({ id: u.id, email: u.email, role: u.role, level: u.level }));
  res.json(users);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const equipe = await service.buscarPorId(req.params.id);
  res.json(equipe);
}));

router.post('/', asyncHandler(async (req, res) => {
  const equipe = await service.criar(req.body);
  res.status(201).json(equipe);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const equipe = await service.atualizar(req.params.id, req.body);
  res.json(equipe);
}));

router.post('/:id/membros', asyncHandler(async (req, res) => {
  const membro = await service.adicionarMembro(req.params.id, req.body);
  res.status(201).json(membro);
}));

router.delete('/:id/membros/:membroId', asyncHandler(async (req, res) => {
  await service.removerMembro(req.params.id, req.params.membroId);
  res.status(204).send();
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await service.remover(req.params.id);
  res.status(204).send();
}));

export default router;
