import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { AppError, ValidationError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface Pausa {
  inicio: string;
  fim?: string;
  tipo: 'pausa' | 'fim_expediente';
  justificativa: string;
  tarefaVinculadaId?: string;
}

export interface Extensao {
  dias: number;
  justificativa: string;
  criadaEm: string;
}

export interface BlocoNota {
  id: string;
  texto: string;
  criadoEm: string;
  autor: string;
}

export interface HistoricoTarefa {
  id: string;
  acao: string;
  detalhes: string;
  data: string;
  usuario?: string;
}

export interface Atividade {
  id: string;
  empresaId?: string;
  tag?: string;
  titulo: string;
  descricao: string;
  responsaveis: string[];
  meses: string[];
  contaContabilIds?: string[];
  contaContabilNomes?: string[];
  /** @deprecated Usar contaContabilIds */
  contaContabilId?: string;
  /** @deprecated Usar contaContabilNomes */
  contaContabilNome?: string;
  dataInicio: string;
  dataFim: string;
  dataFimOriginal: string;
  paiId?: string;
  filhosIds: string[];
  nivel: number;
  bloqueadoPor: string[];
  status: 'pending' | 'running' | 'paused' | 'completed';
  timerStart?: string;
  timerTotal: number;
  pausas: Pausa[];
  observacoes: string;
  blocosNota: BlocoNota[];
  historico: HistoricoTarefa[];
  onTime: boolean;
  extensoes: Extensao[];
  alertaEnviado: boolean;
  concluidaEm?: string;
  recorrencia?: { tipo: 'semanal' | 'mensal' | 'anual'; intervalo: number };
  createdAt: string;
}

export class PlannerService {
  private persistence = new SqlitePersistence<Atividade>('atividades');

  private get atividades() { return this.persistence.getAll(); }

  async listar(filtro?: { empresaId?: string; equipe?: string; mes?: string; status?: string; responsavel?: string }) {
    let result = this.atividades;
    if (filtro?.empresaId) result = result.filter(a => a.empresaId === filtro.empresaId);
    if (filtro?.mes) {
      const mesesList = filtro.mes.split(',').map(m => m.trim()).filter(Boolean);
      result = result.filter(a => (a.meses || []).some(m => mesesList.includes(m)));
    }
    if (filtro?.status) result = result.filter(a => a.status === filtro.status);
    if (filtro?.responsavel) result = result.filter(a => a.responsaveis.includes(filtro.responsavel!));
    return result;
  }

  async buscarPorId(id: string) {
    return this.persistence.getById(id) || null;
  }

  async criar(dados: {
    empresaId?: string; tag?: string; titulo: string; descricao?: string;
    responsaveis: string[]; meses: string[]; dataInicio: string; dataFim: string;
    contaContabilIds?: string[]; contaContabilNomes?: string[];
    recorrencia?: { tipo: 'semanal' | 'mensal' | 'anual'; intervalo: number };
    paiId?: string;
  }) {
    if (!dados.titulo) throw new ValidationError('Título é obrigatório');
    if (!dados.dataInicio || !dados.dataFim) throw new ValidationError('Data início e data fim são obrigatórias');

    let nivel = 0;

    if (dados.paiId) {
      const pai = this.persistence.getById(dados.paiId);
      if (!pai) throw new NotFoundError('Atividade pai não encontrada');
      nivel = (pai.nivel || 0) + 1;
    }

    const nova: Atividade = {
      id: generateId(),
      empresaId: dados.empresaId,
      tag: dados.tag,
      titulo: dados.titulo,
      descricao: dados.descricao || '',
      responsaveis: dados.responsaveis,
      meses: dados.meses,
      contaContabilIds: dados.contaContabilIds,
      contaContabilNomes: dados.contaContabilNomes,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim,
      dataFimOriginal: dados.dataFim,
      paiId: dados.paiId,
      filhosIds: [],
      nivel,
      status: 'pending',
      bloqueadoPor: [],
      timerTotal: 0,
      pausas: [],
      observacoes: '',
      blocosNota: [],
      historico: [{ id: generateId(), acao: 'criada', detalhes: 'Tarefa criada', data: new Date().toISOString() }],
      onTime: true,
      extensoes: [],
      alertaEnviado: false,
      recorrencia: dados.recorrencia,
      createdAt: new Date().toISOString(),
    };

    await this.persistence.add(nova);

    if (dados.paiId) {
      const pai = this.persistence.getById(dados.paiId);
      if (pai) {
        await this.persistence.update(pai.id, { filhosIds: [...(pai.filhosIds || []), nova.id] });
      }
    }

    if (dados.recorrencia) {
      this.criarRecorrencias(nova, dados).catch(err => { logger.error({ err }, 'Erro ao criar recorrências'); });
    }

    return nova;
  }

  private async criarRecorrencias(base: Atividade, dados: any) {
    const tipo = dados.recorrencia?.tipo || 'mensal';
    const intervalo = dados.recorrencia?.intervalo || 1;
    const qtd = tipo === 'semanal' ? Math.floor(52 / intervalo) : tipo === 'anual' ? Math.floor(5 / intervalo) : Math.floor(12 / intervalo);
    for (let i = 1; i <= qtd; i++) {
      const inicio = new Date(base.dataInicio);
      const fim = new Date(base.dataFim);
      if (tipo === 'semanal') {
        inicio.setDate(inicio.getDate() + i * 7 * intervalo);
        fim.setDate(fim.getDate() + i * 7 * intervalo);
      } else if (tipo === 'anual') {
        inicio.setFullYear(inicio.getFullYear() + i * intervalo);
        fim.setFullYear(fim.getFullYear() + i * intervalo);
      } else {
        inicio.setMonth(inicio.getMonth() + i * intervalo);
        fim.setMonth(fim.getMonth() + i * intervalo);
      }
      const nova: Atividade = {
        id: generateId(),
        empresaId: base.empresaId,
        tag: base.tag,
        titulo: base.titulo,
        descricao: base.descricao,
        responsaveis: base.responsaveis,
        meses: base.meses,
        contaContabilIds: base.contaContabilIds,
        contaContabilNomes: base.contaContabilNomes,
        dataInicio: inicio.toISOString().split('T')[0],
        dataFim: fim.toISOString().split('T')[0],
        dataFimOriginal: base.dataFimOriginal || base.dataFim,
        paiId: base.paiId,
        filhosIds: [],
        nivel: base.nivel || 0,
        status: 'pending',
        bloqueadoPor: [],
        timerTotal: 0,
        pausas: [],
        observacoes: '',
        blocosNota: [],
        historico: [],
        onTime: true,
        extensoes: [],
        alertaEnviado: false,
        recorrencia: base.recorrencia,
        createdAt: new Date().toISOString(),
      };
      await this.persistence.add(nova);
    }
  }

  private async atualizarStatusCascata(id: string, status: Atividade['status']) {
    const atv = this.persistence.getById(id);
    if (!atv || !atv.filhosIds) return;

    for (const filhoId of atv.filhosIds) {
      const filho = this.persistence.getById(filhoId);
      if (filho && filho.status !== status) {
        const agora = new Date().toISOString();
        const historico = [...(filho.historico || []), { 
          id: generateId(), 
          acao: 'status_atualizado_cascata', 
          detalhes: `Status alterado para ${status} devido à atividade pai`, 
          data: agora 
        }];
        await this.persistence.update(filhoId, { status, historico });
        await this.atualizarStatusCascata(filhoId, status);
      }
    }
  }

  async iniciarTimer(id: string, usuarioId: string) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');
    if (atv.status === 'completed') throw new ValidationError('Atividade já concluída');

    if (atv.bloqueadoPor && atv.bloqueadoPor.length > 0) {
      const bloqueadoresIncompletos = atv.bloqueadoPor.filter(bid => {
        const b = this.persistence.getById(bid);
        return b && b.status !== 'completed';
      });
      if (bloqueadoresIncompletos.length > 0) {
        const nomes = bloqueadoresIncompletos.map(bid => this.persistence.getById(bid)?.titulo).filter(Boolean).join(', ');
        throw new Error(`Esta tarefa está bloqueada pelas seguintes atividades incompletas: ${nomes}`);
      }
    }

    const todas = this.atividades;
    const running = todas.find(a => a.status === 'running' && a.responsaveis.includes(usuarioId));
    if (running && running.id !== id) throw new ValidationError('Usuário já possui atividade em andamento');

    const agora = new Date().toISOString();
    const historico = [...(atv.historico || []), { id: generateId(), acao: 'iniciada', detalhes: 'Timer iniciado', data: agora, usuario: usuarioId }];
    await this.persistence.update(id, { status: 'running', timerStart: agora, historico });
    return this.persistence.getById(id);
  }

  async pausarTimer(id: string, justificativa: string, tipo: 'pausa' | 'fim_expediente' = 'pausa', tarefaVinculadaId?: string) {
    if (tipo === 'pausa' && justificativa.length < 3) throw new ValidationError('Justificativa deve ter no mínimo 3 caracteres');

    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');
    if (atv.status !== 'running') throw new ValidationError('Atividade não está em execução');

    const agora = new Date().toISOString();
    let timerTotal = atv.timerTotal;
    if (atv.timerStart) {
      timerTotal += (new Date(agora).getTime() - new Date(atv.timerStart).getTime()) / 1000;
    }

    const pausas = [...(atv.pausas || []), { inicio: agora, justificativa, tipo, tarefaVinculadaId }];
    const historico = [...(atv.historico || []), { id: generateId(), acao: tipo === 'fim_expediente' ? 'pausa_fim_expediente' : 'pausa', detalhes: justificativa || 'Fim de expediente', data: agora }];
    await this.persistence.update(id, { status: 'paused', timerTotal, timerStart: undefined, pausas, historico });
    
    await this.atualizarStatusCascata(id, 'paused');
    
    return this.persistence.getById(id);
  }

  async retomarTimer(id: string, tipo: 'normal' | 'inicio_expediente' = 'normal') {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');
    if (atv.status !== 'paused') throw new ValidationError('Atividade não está pausada');

    const pausas = [...(atv.pausas || [])];
    const ultimaPausa = pausas[pausas.length - 1];
    if (ultimaPausa && !ultimaPausa.fim) {
      ultimaPausa.fim = new Date().toISOString();
    }

    const historico = [...(atv.historico || []), { id: generateId(), acao: tipo === 'inicio_expediente' ? 'retomada_inicio_expediente' : 'retomada', detalhes: tipo === 'inicio_expediente' ? 'Início de expediente' : 'Retomada manual', data: new Date().toISOString() }];
    await this.persistence.update(id, { status: 'running', timerStart: new Date().toISOString(), pausas, historico });
    
    await this.atualizarStatusCascata(id, 'running');
    
    return this.persistence.getById(id);
  }

  async concluir(id: string) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');

    const agora = new Date();
    const agoraISO = agora.toISOString();

    let timerTotal = atv.timerTotal;
    if (atv.status === 'running' && atv.timerStart) {
      timerTotal += (agora.getTime() - new Date(atv.timerStart).getTime()) / 1000;
    }

    const deadlineEnd = new Date(atv.dataFim + 'T23:59:59');
    const onTime = atv.extensoes.length === 0 && !(agora > deadlineEnd);

    const historico = [...(atv.historico || []), { id: generateId(), acao: 'concluida', detalhes: onTime ? 'Concluída no prazo' : 'Concluída fora do prazo', data: agoraISO }];
    await this.persistence.update(id, {
      status: 'completed',
      timerStart: undefined,
      timerTotal,
      concluidaEm: agoraISO,
      onTime,
      historico,
    });

    await this.atualizarStatusCascata(id, 'completed');

    return this.persistence.getById(id);
  }

  async estenderPrazo(id: string, dias: number, justificativa: string) {
    if (dias <= 0) throw new ValidationError('Dias deve ser positivo');
    if (justificativa.length < 3) throw new ValidationError('Justificativa deve ter no mínimo 3 caracteres');

    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');
    if (atv.status === 'completed') throw new ValidationError('Atividade já concluída');

    const novaData = new Date(atv.dataFim);
    novaData.setDate(novaData.getDate() + dias);

    const extensoes = [...(atv.extensoes || []), { dias, justificativa, criadaEm: new Date().toISOString() }];
    const historico = [...(atv.historico || []), { id: generateId(), acao: 'prazo_estendido', detalhes: `Prazo estendido em ${dias} dias: ${justificativa}`, data: new Date().toISOString() }];
    await this.persistence.update(id, {
      dataFim: novaData.toISOString().split('T')[0],
      extensoes,
      historico,
    });

    return this.persistence.getById(id);
  }

  async adicionarObservacao(id: string, texto: string, autor: string) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');

    const bloco: BlocoNota = { id: generateId(), texto, criadoEm: new Date().toISOString(), autor };
    const blocosNota = [...(atv.blocosNota || []), bloco];
    await this.persistence.update(id, { blocosNota });
    return bloco;
  }

  private async atualizarNiveisRecursivo(id: string, novoNivel: number) {
    const atv = this.persistence.getById(id);
    if (!atv) return;

    await this.persistence.update(id, { nivel: novoNivel });

    if (atv.filhosIds && atv.filhosIds.length > 0) {
      for (const filhoId of atv.filhosIds) {
        await this.atualizarNiveisRecursivo(filhoId, novoNivel + 1);
      }
    }
  }

  async atualizar(id: string, dados: Partial<Atividade>) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');
    if (dados.dataFim && dados.dataFim !== atv.dataFim && atv.status !== 'pending') {
      throw new ValidationError('Não é possível alterar data fim após iniciar a atividade');
    }
    
    if (dados.paiId !== undefined && dados.paiId !== atv.paiId) {
      if (dados.paiId === id) throw new ValidationError('Uma atividade não pode ser pai de si mesma');
      
      // Check for circular dependency
      let currentPaiId: string | undefined = dados.paiId;
      const visited = new Set<string>([id]);
      while (currentPaiId) {
        if (visited.has(currentPaiId)) throw new ValidationError('Circular dependency detected: a task cannot be a descendant of itself');
        visited.add(currentPaiId);
        const pai = this.persistence.getById(currentPaiId);
        currentPaiId = pai?.paiId;
      }

      // Remove from old parent
      if (atv.paiId) {
        const oldPai = this.persistence.getById(atv.paiId);
        if (oldPai && oldPai.filhosIds) {
          await this.persistence.update(oldPai.id, { filhosIds: oldPai.filhosIds.filter(fid => fid !== id) });
        }
      }
      if (dados.paiId) {
        const newPai = this.persistence.getById(dados.paiId);
        if (newPai) {
          await this.persistence.update(newPai.id, { filhosIds: [...(newPai.filhosIds || []), id] });
        }
      }
    }

    await this.persistence.update(id, dados);
    
    if (dados.paiId !== undefined) {
      const pai = this.persistence.getById(dados.paiId || '');
      const nivelBase = pai ? (pai.nivel || 0) + 1 : 0;
      await this.atualizarNiveisRecursivo(id, nivelBase);
    }

    return this.persistence.getById(id);
  }

  async adicionarBloqueio(id: string, bloqueadorId: string) {
    if (id === bloqueadorId) throw new ValidationError('Uma tarefa não pode bloquear a si mesma');
    const atv = this.persistence.getById(id);
    const bloqueador = this.persistence.getById(bloqueadorId);
    if (!atv || !bloqueador) throw new NotFoundError('Atividade não encontrada');

    const bloqueadoPor = [...(atv.bloqueadoPor || []), bloqueadorId];
    const historico = [...(atv.historico || []), { 
      id: generateId(), 
      acao: 'bloqueio_adicionado', 
      detalhes: `Tarefa bloqueada por: ${bloqueador.titulo}`, 
      data: new Date().toISOString() 
    }];
    
    await this.persistence.update(id, { bloqueadoPor, historico });
    return this.persistence.getById(id);
  }

  async removerBloqueio(id: string, bloqueadorId: string) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');

    const bloqueadoPor = (atv.bloqueadoPor || []).filter(bid => bid !== bloqueadorId);
    const historico = [...(atv.historico || []), { 
      id: generateId(), 
      acao: 'bloqueio_removido', 
      detalhes: `Bloqueio removido`, 
      data: new Date().toISOString() 
    }];
    
    await this.persistence.update(id, { bloqueadoPor, historico });
    return this.persistence.getById(id);
  }

  async remover(id: string) {
    const atv = this.persistence.getById(id);
    if (!atv) throw new NotFoundError('Atividade não encontrada');

    if (atv.paiId) {
      const pai = this.persistence.getById(atv.paiId);
      if (pai && pai.filhosIds) {
        await this.persistence.update(pai.id, { filhosIds: pai.filhosIds.filter(fid => fid !== id) });
      }
    }

    if (atv.filhosIds && atv.filhosIds.length > 0) {
      for (const filhoId of atv.filhosIds) {
        await this.remover(filhoId);
      }
    }

    const ok = await this.persistence.delete(id);
    if (!ok) throw new ValidationError('Erro ao remover atividade');
  }

  async verificarAlertas(): Promise<any[]> {
    const alertas: any[] = [];
    const agora = new Date();

    for (const atv of this.atividades) {
      if (atv.status === 'completed' || atv.alertaEnviado) continue;

      if (atv.status === 'running' && atv.timerStart) {
        const decorrido = (agora.getTime() - new Date(atv.timerStart).getTime()) / 1000;
        if (decorrido > 1800) {
          await this.persistence.update(atv.id, { alertaEnviado: true });
          alertas.push({ id: atv.id, tipo: 'tempo_excedido', mensagem: `Atividade "${atv.titulo}" com mais de 30 min em execução`, data: agora.toISOString() });
        }
      }

      const prazo = new Date(atv.dataFim);
      const diff = (agora.getTime() - prazo.getTime()) / 1000;
      if (diff > 0 && !atv.alertaEnviado) {
        await this.persistence.update(atv.id, { alertaEnviado: true });
        alertas.push({ id: atv.id, tipo: 'atrasada', mensagem: `Atividade "${atv.titulo}" atrasada desde ${prazo.toLocaleDateString()}`, data: agora.toISOString() });
      }
    }

    return alertas;
  }
}
