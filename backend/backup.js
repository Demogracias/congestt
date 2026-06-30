const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.resolve(__dirname, '../data');
const BACKUP_DIR = path.resolve(__dirname, '../backups');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function backup() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('[Backup] data/ não encontrado');
    return;
  }
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = timestamp();
  const dest = path.join(BACKUP_DIR, `congestt_${ts}`);

  try {
    execSync(`cd /d "${DATA_DIR}" && sqlite3 congestt.db .dump > "${dest}.sql"`, { shell: true, stdio: 'pipe' });
    console.log(`[Backup] Dump SQL: ${dest}.sql`);
  } catch {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(DATA_DIR, dest, { recursive: true });
    console.log(`[Backup] Cópia dos arquivos: ${dest}`);
  }
}

if (require.main === module) backup();
module.exports = backup;
