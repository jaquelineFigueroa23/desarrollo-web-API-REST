import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm"
      style={{ backgroundImage: 'linear-gradient(90deg, #6a11cb, #2575fc)' }}>
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold">AuthDemo</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nv">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="nv">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink to="/" className="nav-link">Inicio</NavLink></li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <span className="text-white-50 d-none d-sm-inline">
                  Hola, <strong className="text-white">{user.name}</strong>
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-outline-light btn-sm">Login</NavLink>
                <NavLink to="/register" className="btn btn-light btn-sm">Registro</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
