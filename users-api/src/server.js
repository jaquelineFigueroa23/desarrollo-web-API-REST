import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

/**
 * API REST: Gestión de usuarios (en memoria).
 * Recurso: Usuario { dpi, name, email, password }
 * Reglas:
 *  - dpi: 13 dígitos numéricos, único
 *  - email: formato válido, único (insensible a mayúsculas)
 *  - password: >=8, al menos 1 mayúscula, 1 número, 1 símbolo
 *  - No se expone "password" en respuestas
 * Endpoints:
 *  - POST   /users
 *  - GET    /users?name=&email=&limit=&offset=
 *  - PUT    /users/:dpi
 *  - DELETE /users/:dpi
 */

// --- Estado en memoria ---
const users = []; // cada user: { dpi, name, email, password }

// --- Utilidades de validación ---
const isValidDPI = (dpi) => /^\d{13}$/.test(String(dpi));
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
const isValidPassword = (pwd) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(pwd));

const normalizeEmail = (email) => String(email).trim().toLowerCase();

// quitar password antes de responder
const publicUser = ({ password, ...rest }) => rest;

// --- App base ---
const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Salud
app.get('/', (_req, res) => {
  res.json({ message: 'Users API up', endpoints: ['/users'] });
});

/**
 * POST /users
 * Crea usuario validando:
 * - Campos requeridos
 * - dpi (13 dígitos) y email (formato) y password (regla)
 * - unicidad de dpi y email
 * Errores:
 * - 400 Bad Request (datos inválidos)
 * - 409 Conflict (dpi o email ya registrado)
 */
app.post('/users', (req, res) => {
  const { dpi, name, email, password } = req.body || {};

  // Requeridos
  if (!dpi || !name || !email || !password) {
    return res.status(400).json({
      error: 'Campos requeridos: dpi, name, email, password',
    });
  }

  // Validaciones de formato
  if (!isValidDPI(dpi)) {
    return res.status(400).json({ error: 'DPI inválido: 13 dígitos numéricos' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email con formato inválido' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error:
        'Password inválido: mínimo 8 caracteres, incluir 1 mayúscula, 1 número y 1 símbolo',
    });
  }

  // Unicidad
  const emailNorm = normalizeEmail(email);
  const existsDPI = users.some((u) => u.dpi === String(dpi));
  const existsEmail = users.some((u) => normalizeEmail(u.email) === emailNorm);

  if (existsDPI || existsEmail) {
    return res.status(409).json({
      error: 'Conflicto: DPI o email ya registrado',
      conflict: {
        dpi: existsDPI,
        email: existsEmail,
      },
    });
  }

  users.push({
    dpi: String(dpi),
    name: String(name).trim(),
    email: emailNorm,
    password: String(password),
  });

  return res.status(201).json({
    message: 'Usuario creado',
    user: publicUser(users.at(-1)),
  });
});

/**
 * GET /users
 * Lista usuarios sin exponer password
 * Filtros opcionales:
 *  - ?name= (parcial, case-insensitive)
 *  - ?email= (exacto, case-insensitive)
 * Paginación:
 *  - ?limit= (default 50, máx 100)
 *  - ?offset= (default 0)
 */
app.get('/users', (req, res) => {
  const { name, email, limit = '50', offset = '0' } = req.query;

  let filtered = [...users];

  if (name) {
    const needle = String(name).toLowerCase();
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(needle));
  }

  if (email) {
    const emailNorm = normalizeEmail(email);
    filtered = filtered.filter((u) => normalizeEmail(u.email) === emailNorm);
  }

  let lim = parseInt(String(limit), 10);
  let off = parseInt(String(offset), 10);
  if (Number.isNaN(lim) || lim <= 0) lim = 50;
  if (Number.isNaN(off) || off < 0) off = 0;
  if (lim > 100) lim = 100;

  const total = filtered.length;
  const page = filtered.slice(off, off + lim).map(publicUser);

  res.json({
    total,
    limit: lim,
    offset: off,
    data: page,
  });
});

/**
 * PUT /users/:dpi
 * Actualiza un usuario existente.
 * - Si no existe, 404
 * - Body puede incluir: name, email, password, dpi (para cambiarlo)
 * - Validar nuevos valores si vienen
 * - Chequear conflictos de dpi/email con OTROS usuarios
 */
app.put('/users/:dpi', (req, res) => {
  const targetDPI = String(req.params.dpi);
  const idx = users.findIndex((u) => u.dpi === targetDPI);
  if (idx === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { name, email, password, dpi } = req.body || {};
  const current = users[idx];

  // Validaciones de campos si vienen
  if (dpi !== undefined) {
    if (!isValidDPI(dpi)) {
      return res.status(400).json({ error: 'Nuevo DPI inválido (13 dígitos)' });
    }
    const newDPI = String(dpi);
    if (newDPI !== current.dpi && users.some((u, i) => i !== idx && u.dpi === newDPI)) {
      return res.status(409).json({ error: 'Conflicto: nuevo DPI ya existe' });
    }
    current.dpi = newDPI;
  }

  if (email !== undefined) {
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Nuevo email con formato inválido' });
    }
    const emailNorm = normalizeEmail(email);
    if (
      emailNorm !== normalizeEmail(current.email) &&
      users.some((u, i) => i !== idx && normalizeEmail(u.email) === emailNorm)
    ) {
      return res.status(409).json({ error: 'Conflicto: email ya existe' });
    }
    current.email = emailNorm;
  }

  if (password !== undefined) {
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          'Password inválido: mínimo 8 caracteres, incluir 1 mayúscula, 1 número y 1 símbolo',
      });
    }
    current.password = String(password);
  }

  if (name !== undefined) {
    current.name = String(name).trim();
  }

  users[idx] = current;
  return res.json({ message: 'Usuario actualizado', user: publicUser(current) });
});

/**
 * DELETE /users/:dpi
 * Elimina un usuario por DPI.
 * - 404 si no existe
 * - 204 si se elimina
 */
app.delete('/users/:dpi', (req, res) => {
  const targetDPI = String(req.params.dpi);
  const idx = users.findIndex((u) => u.dpi === targetDPI);
  if (idx === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  users.splice(idx, 1);
  return res.status(204).send(); // sin cuerpo
});

// --- Puerto (Render usa PORT) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Users API escuchando en http://localhost:${PORT}`);
});
