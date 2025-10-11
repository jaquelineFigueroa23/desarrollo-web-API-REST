import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <div className="fullscreen-wrapper">
        <div className="container">
          <div className="row justify-content-center text-center text-white">
            <div className="col-12 col-lg-9">
              <h1 className="display-5 fw-bold mb-3">Demo de Registro & Login</h1>
              <p className="lead mb-4">React + Context + Bootstrap + Express (memoria)</p>
              {user ? (
                <div className="alert alert-success card-glass d-inline-block">
                  Sesión activa como <strong>{user.name}</strong> ({user.email})
                </div>
              ) : (
                <div className="alert alert-light card-glass d-inline-block">
                  No ha iniciado sesión. Ingrese a <strong>Login</strong> o <strong>Registro</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="app-footer">© {new Date().getFullYear()} AuthDemo</footer>
    </>
  );
}
