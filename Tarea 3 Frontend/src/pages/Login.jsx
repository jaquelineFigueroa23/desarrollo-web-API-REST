import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;


export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const nav = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
        
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        nav('/');
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <>
      <div className="fullscreen-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6 col-xxl-4">
              <div className="card card-glass p-4 p-lg-5">
                <h2 className="mb-2">Iniciar sesión</h2>
                <p className="subtitle mb-4">Bienvenido de vuelta.</p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form className="row g-3" onSubmit={onSubmit}>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input className="form-control form-control-lg" type="email" name="email" value={form.email} onChange={onChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Contraseña</label>
                    <input className="form-control form-control-lg" type="password" name="password" value={form.password} onChange={onChange} required />
                  </div>

                  <div className="col-12 d-flex gap-2 mt-2">
                    <button className="btn btn-gradient btn-lg">Entrar</button>
                    <Link to="/register" className="btn btn-outline-secondary btn-lg">Crear cuenta</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="app-footer">© {new Date().getFullYear()} AuthDemo</footer>
    </>
  );
}
