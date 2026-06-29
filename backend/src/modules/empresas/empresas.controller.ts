import express from 'express';
import { EmpresasService } from './empresas.service';
import { auditService } from '../audit/audit.service';

const router = express.Router();
const service = new EmpresasService();

router.get('/', async (req, res) => {
  try {
    const { porte, equipe, atividade, grupoEconomico, search } = req.query as any;
    const result = await service.listar({ porte, equipe, atividade, grupoEconomico, search });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/grupos', async (req, res) => {
  try {
    const grupos = await service.gruposEconomicos();
    res.json(grupos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/grupos', async (req, res) => {
  try {
    const { nome } = req.body;
    const grupo = await service.criarGrupo(nome);
    res.status(201).json(grupo);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/consultar-cnpj/:cnpj', async (req, res) => {
  try {
    const data = await service.consultar(req.params.cnpj);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/vincular-filiais/:cnpj', async (req, res) => {
  try {
    const filiais = await service.vincularFiliais(req.params.cnpj);
    res.json(filiais);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const empresa = await service.buscarPorId(req.params.id);
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const empresa = await service.criar(req.body);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'criar', recurso: 'empresa', recursoId: empresa.id, detalhes: `Nova empresa: ${empresa.apelido}` }).catch(() => {});
    res.status(201).json(empresa);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const empresa = await service.atualizar(req.params.id, req.body);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'atualizar', recurso: 'empresa', recursoId: empresa?.id, detalhes: `Empresa atualizada: ${empresa?.apelido}` }).catch(() => {});
    res.json(empresa);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    await service.remover(req.params.id);
    auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'excluir', recurso: 'empresa', recursoId: req.params.id, detalhes: `Empresa removida: ${req.params.id}` }).catch(() => {});
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
