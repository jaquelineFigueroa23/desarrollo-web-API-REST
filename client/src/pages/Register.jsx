import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;



export default function Register() {
  const [form, setForm] = useState({ name:'', dpi:'', email:'', password:'' });
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
        
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      if (res.status === 201) {
        nav('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Error en el registro');
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
            <div className="col-12 col-md-10 col-lg-8 col-xxl-6">
              <div className="card card-glass p-4 p-lg-5">
                <h2 className="mb-2">Crear cuenta</h2>
                <p className="subtitle mb-4">Complete sus datos para registrarse.</p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form className="row g-3" onSubmit={onSubmit}>
                  <div className="col-md-6">
                    <label className="form-label">Nombre</label>
                    <input className="form-control form-control-lg" name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">DPI (13 dígitos)</label>
                    <input className="form-control form-control-lg" name="dpi" value={form.dpi} onChange={onChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className="form-control form-control-lg" type="email" name="email" value={form.email} onChange={onChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contraseña</label>
                    <input className="form-control form-control-lg" type="password" name="password" value={form.password} onChange={onChange} required />
                    <div className="form-text">Mínimo 8, incluye mayúscula, número y símbolo.</div>
                  </div>

                  <div className="col-12 d-flex gap-2 mt-2">
                    <button className="btn btn-gradient btn-lg">Registrarme</button>
                    <Link to="/login" className="btn btn-outline-secondary btn-lg">Ya tengo cuenta</Link>
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
