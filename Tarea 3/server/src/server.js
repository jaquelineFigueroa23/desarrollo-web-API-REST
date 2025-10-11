import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
// ⚠️ Ajusta esto si tu frontend queda en otro origen:
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS no permitido'), false);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

/** "BD" en memoria */
const users = []; // cada user: { name, dpi, email, password }

/** Validaciones simples */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
const isValidDPI = (dpi) => /^\d{13}$/.test(String(dpi));
const isValidPassword = (pwd) => /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(pwd));

/** Health */
app.get('/api', (_req, res) => {
  res.json({ message: 'Auth API up', endpoints: ['/api/register', '/api/login'] });
});

/** POST /api/register */
app.post('/api/register', (req, res) => {
  const { name, dpi, email, password } = req.body || {};

  if (!name || !dpi || !email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: name, dpi, email, password' });
  }
  if (!isValidDPI(dpi)) return res.status(400).json({ error: 'DPI inválido: 13 dígitos numéricos' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' });
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password inválido: >=8, 1 mayúscula, 1 número y 1 símbolo' });
  }

  const exists = users.some(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email ya registrado' });

  users.push({ name: String(name).trim(), dpi: String(dpi), email: String(email).toLowerCase(), password: String(password) });

  // Para esta tarea NO creamos token; solo confirmamos y el frontend redirige a /login
  return res.status(201).json({ message: 'Registro exitoso' });
});

/** POST /api/login */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Campos requeridos: email, password' });

  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Simulamos "sesión" devolviendo el perfil sin password
  const { password: _, ...profile } = user;
  return res.json({ message: 'Login exitoso', user: profile });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Auth API escuchando en http://localhost:${PORT}`));
