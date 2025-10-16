

# Users API – Node.js + Express + JWT

API REST (almacenamiento **en memoria**) para gestionar usuarios y autenticarse con **JSON Web Tokens (JWT)**.

## Descripción
* **URL RENDER:** https://hoja-de-trabajo-7-wl6b.onrender.com/
* Se agregò un archivo word con imagenes de pruebas con jwt que es con login y otra con users

* **Recurso:** `Usuario { dpi, name, email, password }`
* **Reglas de negocio:**

  * `dpi`: exactamente **13 dígitos** numéricos, **único**.
  * `email`: formato válido, **único** (insensible a mayúsculas).
  * `password`: **≥ 8** caracteres, **1 mayúscula**, **1 número**, **1 símbolo**.
  * El campo **password no se expone** en respuestas.
* **Autenticación:**

  * `POST /login` genera un **JWT** válido por **30s**.
  * Se requieren tokens válidos para **GET /users**, **PUT /users/:id**, **DELETE /users/:id**.
  * En esta API, `:id` ≡ `dpi`.

### Endpoints

* `POST /users` – Crear usuario (público)
* `POST /login` – Autenticación, devuelve `{ token, expiresIn }` (público)
* `GET /users` – Listar usuarios (protegido)
* `PUT /users/:id` – Actualizar usuario por DPI (protegido)
* `DELETE /users/:id` – Eliminar usuario por DPI (protegido)

> Nota: El almacenamiento es **en memoria**. Si el proceso se reinicia (p. ej., en Render), los datos se pierden.

---

## Ejecutar la API localmente

### Requisitos

* Node.js 18+
* npm

### 1) Clonar e instalar

```bash
git clone <URL_DE_TU_REPO>
cd users-api
npm install
```

### 2) Variables de entorno

Crea un archivo **`.env`** en la raíz del proyecto:

```env
PORT=3000
JWT_SECRET=pon_una_clave_larga_y_unica
JWT_EXPIRES_IN=30s
```

Asegúrate de tener `.env` en tu `.gitignore`.

### 3) Ejecutar en desarrollo

Si tu `package.json` apunta a `src/server.js`:

```bash
npm run dev
# o
npm start
```

Verás algo como:

```
Users API escuchando en http://localhost:3000
```

---

## Probar 

### 1) Crear usuario (público)

```
POST http://localhost:3000/users
Content-Type: application/json
```

Body:

```json
{
  "dpi": "1234567890123",
  "name": "Maria",
  "email": "maria@mail.com",
  "password": "Mariaaaaa1!"
}
```

### 2) Login (obtener token 30s)

```
POST http://localhost:3000/login
Content-Type: application/json
```

Body:

```json
{
  "email": "maria@mail.com",
  "password": "Mariaaaaa1!"
}
```

Respuesta:

```json
{ "token": "<JWT>", "expiresIn": "30s" }
```

### 3) Usar token en rutas protegidas

**GET /users**

```
GET http://localhost:3000/users
Authorization: Bearer <JWT>
```

**PUT /users/:id** (id = dpi)

```
PUT http://localhost:3000/users/1234567890123
Authorization: Bearer <JWT>
Content-Type: application/json
```

Body:

```json
{ "name": "Maria Actualizada" }
```

**DELETE /users/:id**

```
DELETE http://localhost:3000/users/1234567890123
Authorization: Bearer <JWT>
```

> Si ves `401 Token expirado`, repite **/login** (el token dura 30s).

---

## Scripts útiles (package.json)

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

---
