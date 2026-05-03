// backend/generate-hash.js
const bcrypt = require('bcrypt');

async function main() {
  const passwords = {
    admin: 'admin123',
    petugas: 'petugas123',
    mahasiswa: 'mhs123',
    dosen: 'dosen123',
  };

  for (const [role, pass] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pass, 10);
    console.log(`${role}: ${hash}`);
  }
}

main();