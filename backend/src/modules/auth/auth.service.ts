import { SqlitePersistence, generateId } from '../../database/SqlitePersistence';
import { generateToken } from '../../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger';

export class AuthService {
  private users: SqlitePersistence<{ id: string; email: string; password: string; role: string; level: number }>;
  private initPromise: Promise<void>;

  constructor() {
    this.users = new SqlitePersistence<{ id: string; email: string; password: string; role: string; level: number }>('users');
    this.initPromise = this.initialize();
  }

  private async initialize() {
    const all = this.users.getAll();
    if (all.length === 0) {
      const adminHash = await bcrypt.hash('123', 10);
      const userHash = await bcrypt.hash('123', 10);
      await this.users.add({ id: '1', email: 'admin@congestt.com', password: adminHash, role: 'Gerente', level: 6 });
      await this.users.add({ id: '2', email: 'user@congestt.com', password: userHash, role: 'Analista', level: 4 });
      logger.info('Usuários padrão criados');
    }
    await this.migrarSenhas();
  }

  private async migrarSenhas() {
    const all = this.users.getAll();
    let altered = false;
    for (const u of all) {
      if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        const hashed = await bcrypt.hash(u.password, 10);
        await this.users.update(u.id, { password: hashed });
        altered = true;
      }
    }
    if (altered) logger.info('Senhas migradas para bcrypt');
  }

  private registrationKeys: Record<string, { role: string; level: number }> = {
    'KEY-GERENTE-001': { role: 'Gerente', level: 6 },
    'KEY-SUPER-001': { role: 'Supervisor', level: 5 },
    'KEY-ANALISTA-001': { role: 'Analista', level: 4 },
    'KEY-ASSIST-001': { role: 'Assistente', level: 3 },
    'KEY-AUXILIAR-001': { role: 'Auxiliar', level: 2 },
    'KEY-ESTAGIARIO-001': { role: 'Estagiário', level: 1 },
  };

  async listarUsuarios() {
    await this.initPromise;
    return this.users.getAll().map(u => ({ id: u.id, email: u.email, role: u.role, level: u.level }));
  }

  async login(email: string, pass: string) {
    await this.initPromise;
    const user = this.users.getAll().find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    const match = await bcrypt.compare(pass, user.password);
    if (!match) throw new Error('Invalid credentials');
    const { password: _, ...safe } = user;
    return { ...safe, token: generateToken(safe) };
  }

  async register(email: string, pass: string, key: string) {
    await this.initPromise;
    const keyData = this.registrationKeys[key];
    if (!keyData) throw new Error('Invalid or expired registration key');

    const hashed = await bcrypt.hash(pass, 10);
    const newUser = {
      id: generateId(),
      email,
      password: hashed,
      role: keyData.role,
      level: keyData.level,
    };

    await this.users.add(newUser);
    const { password: _, ...safe } = newUser;
    return { ...safe, token: generateToken(safe) };
  }
}

export const authService = new AuthService();
