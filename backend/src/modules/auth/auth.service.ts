import { Persistence } from '../../utils/persistence';
import { generateToken } from '../../middleware/authMiddleware';
import bcrypt from 'bcryptjs';

export class AuthService {
  private users: Persistence<{ id: string; email: string; password: string; role: string; level: number }>;
  private migrated = false;

  constructor() {
    this.users = new Persistence<{ id: string; email: string; password: string; role: string; level: number }>('users.json', [
      { id: '1', email: 'admin@congestt.com', password: bcrypt.hashSync('123', 10), role: 'Gerente', level: 6 },
      { id: '2', email: 'user@congestt.com', password: bcrypt.hashSync('123', 10), role: 'Analista', level: 4 },
    ]);
  }

  private async migrarSenhas() {
    if (this.migrated) return;
    this.migrated = true;
    const all = this.users.getAll();
    let altered = false;
    for (const u of all) {
      if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        this.users.update(u.id, { password: bcrypt.hashSync(u.password, 10) });
        altered = true;
      }
    }
    if (altered) console.log('[Auth] Senhas migradas para bcrypt');
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
    return this.users.getAll().map(u => ({ id: u.id, email: u.email, role: u.role, level: u.level }));
  }

  async login(email: string, pass: string) {
    await this.migrarSenhas();
    const user = this.users.getAll().find(u => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    const match = bcrypt.compareSync(pass, user.password);
    if (!match) throw new Error('Invalid credentials');
    const { password: _, ...safe } = user;
    return { ...safe, token: generateToken(safe) };
  }

  async register(email: string, pass: string, key: string) {
    const keyData = this.registrationKeys[key];
    if (!keyData) throw new Error('Invalid or expired registration key');

    const hashed = bcrypt.hashSync(pass, 10);
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password: hashed,
      role: keyData.role,
      level: keyData.level,
    };

    this.users.add(newUser);
    const { password: _, ...safe } = newUser;
    return { ...safe, token: generateToken(safe) };
  }
}
