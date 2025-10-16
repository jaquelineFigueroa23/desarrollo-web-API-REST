import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


const users = []; 


const isValidDPI = (dpi) => /^\d{13}$/.test(String(dpi));
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
const isValidPassword = (pwd) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(pwd));

const normalizeEmail = (email) => String(email).trim().toLowerCase();
const publicUser = ({ password, ...rest }) => rest;

// --- JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30s';

const signToken = (user) =>
  jwt.sign({ sub: user.dpi, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autorizado: token requerido' });
  }
  try {
    req.auth = jwt.verify(token, JWT_SECRET); // { sub, email, iat, exp }
    return next();
  } catch (e) {
    return res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' });
  }
};

// --- App base ---
const app = express();
app.use(cors());            
app.use(morgan('dev'));
app.use(express.json());

// Salud
app.get('/', (_req, res) => {
  res.json({ message: 'Users API up', endpoints: ['/login', '/users'] });
});

// ====== AUTH ======

app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: email, password' });
  }
  const emailNorm = normalizeEmail(email);
  const user = users.find((u) => normalizeEmail(u.email) === emailNorm);
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = signToken(user);
  return res.json({ token, expiresIn: JWT_EXPIRES_IN });
});

// ====== CRUD ======


app.post('/users', (req, res) => {
  const { dpi, name, email, password } = req.body || {};

  if (!dpi || !name || !email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: dpi, name, email, password' });
  }
  if (!isValidDPI(dpi)) return res.status(400).json({ error: 'DPI inválido: 13 dígitos numéricos' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email con formato inválido' });
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: 'Password inválido: mínimo 8, incluir 1 mayúscula, 1 número y 1 símbolo',
    });
  }

  const emailNorm = normalizeEmail(email);
  const existsDPI = users.some((u) => u.dpi === String(dpi));
  const existsEmail = users.some((u) => normalizeEmail(u.email) === emailNorm);
  if (existsDPI || existsEmail) {
    return res.status(409).json({
      error: 'Conflicto: DPI o email ya registrado',
      conflict: { dpi: existsDPI, email: existsEmail },
    });
  }

  users.push({
    dpi: String(dpi),
    name: String(name).trim(),
    email: emailNorm,
    password: String(password),
  });

  return res.status(201).json({ message: 'Usuario creado', user: publicUser(users.at(-1)) });
});

/**
 * GET /users 
**/
app.get('/users', requireAuth, (req, res) => {
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

  res.json({ total, limit: lim, offset: off, data: page });
});

/**
 * PUT /users/:id  — :id ≡ dpi
 */
const putHandler = (paramName) => (req, res) => {
  const targetDPI = String(req.params[paramName]);
  const idx = users.findIndex((u) => u.dpi === targetDPI);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { name, email, password, dpi } = req.body || {};
  const current = users[idx];

  if (dpi !== undefined) {
    if (!isValidDPI(dpi)) return res.status(400).json({ error: 'Nuevo DPI inválido (13 dígitos)' });
    const newDPI = String(dpi);
    if (newDPI !== current.dpi && users.some((u, i) => i !== idx && u.dpi === newDPI)) {
      return res.status(409).json({ error: 'Conflicto: nuevo DPI ya existe' });
    }
    current.dpi = newDPI;
  }

  if (email !== undefined) {
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Nuevo email con formato inválido' });
    const emailNorm = normalizeEmail(email);
    if (emailNorm !== normalizeEmail(current.email) &&
        users.some((u, i) => i !== idx && normalizeEmail(u.email) === emailNorm)) {
      return res.status(409).json({ error: 'Conflicto: email ya existe' });
    }
    current.email = emailNorm;
  }

  if (password !== undefined) {
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password inválido: mínimo 8, incluir 1 mayúscula, 1 número y 1 símbolo',
      });
    }
    current.password = String(password);
  }

  if (name !== undefined) current.name = String(name).trim();

  users[idx] = current;
  return res.json({ message: 'Usuario actualizado', user: publicUser(current) });
};

app.put('/users/:id', requireAuth, putHandler('id'));
app.put('/users/:dpi', requireAuth, putHandler('dpi')); // compat

/**
 * DELETE /users/:id 
 */
const deleteHandler = (paramName) => (req, res) => {
  const targetDPI = String(req.params[paramName]);
  const idx = users.findIndex((u) => u.dpi === targetDPI);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
  users.splice(idx, 1);
  return res.status(204).send();
};

app.delete('/users/:id', requireAuth, deleteHandler('id'));
app.delete('/users/:dpi', requireAuth, deleteHandler('dpi')); // compat

// --- Puerto (Render usa PORT) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Users API escuchando en http://localhost:${PORT}`);
});
