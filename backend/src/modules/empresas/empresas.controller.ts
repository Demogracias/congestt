import express from 'express';
import { EmpresasService } from './empresas.service';
import { auditService } from '../audit/audit.service';
import { AuthRequest } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { criarEmpresaSchema, atualizarEmpresaSchema, listarEmpresasSchema } from './empresas.schema';

const router = express.Router();
const service = new EmpresasService();

router.get('/', validateQuery(listarEmpresasSchema), asyncHandler(async (req, res) => {
  const q = (req as any).validatedQuery || req.query;
  const result = await service.listar(q);
  res.json(result);
}));

router.get('/grupos', asyncHandler(async (req, res) => {
  const grupos = await service.gruposEconomicos();
  res.json(grupos);
}));

router.post('/grupos', asyncHandler(async (req, res) => {
  const { nome } = req.body;
  const grupo = await service.criarGrupo(nome);
  res.status(201).json(grupo);
}));

router.get('/consultar-cnpj/:cnpj', asyncHandler(async (req, res) => {
  const data = await service.consultar(req.params.cnpj);
  res.json(data);
}));

router.get('/vincular-filiais/:cnpj', asyncHandler(async (req, res) => {
  const filiais = await service.vincularFiliais(req.params.cnpj);
  res.json(filiais);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const empresa = await service.buscarPorId(req.params.id);
  res.json(empresa);
}));

router.post('/', validateBody(criarEmpresaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const empresa = await service.criar(req.body);
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'criar', recurso: 'empresa', recursoId: empresa.id, detalhes: `Nova empresa: ${empresa.apelido}` }).catch(e => console.error('[Audit]', e));
  res.status(201).json(empresa);
}));

router.put('/:id', validateBody(atualizarEmpresaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const empresa = await service.atualizar(req.params.id, req.body);
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'atualizar', recurso: 'empresa', recursoId: empresa?.id, detalhes: `Empresa atualizada: ${empresa?.apelido}` }).catch(e => console.error('[Audit]', e));
  res.json(empresa);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await service.remover(req.params.id);
  auditService.registrar({ usuarioId: req.usuario?.id || 'unknown', acao: 'excluir', recurso: 'empresa', recursoId: req.params.id, detalhes: `Empresa removida: ${req.params.id}` }).catch(e => console.error('[Audit]', e));
  res.status(204).send();
}));

export default router;
