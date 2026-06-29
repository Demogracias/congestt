import express from 'express';
import { EquipesService } from './equipes.service';
import { Persistence } from '../../utils/persistence';

const router = express.Router();
const service = new EquipesService();

router.get('/', async (req, res) => {
  try {
    const result = await service.listar();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const usersPersistence = new Persistence<{ id: string; email: string; role: string; level: number }>('users.json', []);
    const users = usersPersistence.getAll().map(u => ({ id: u.id, email: u.email, role: u.role, level: u.level }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const equipe = await service.buscarPorId(req.params.id);
    if (!equipe) return res.status(404).json({ message: 'Equipe não encontrada' });
    res.json(equipe);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const equipe = await service.criar(req.body);
    res.status(201).json(equipe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const equipe = await service.atualizar(req.params.id, req.body);
    res.json(equipe);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/membros', async (req, res) => {
  try {
    const membro = await service.adicionarMembro(req.params.id, req.body);
    res.status(201).json(membro);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id/membros/:membroId', async (req, res) => {
  try {
    await service.removerMembro(req.params.id, req.params.membroId);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.remover(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
