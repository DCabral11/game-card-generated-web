# City Game Card (Node.js + Express + MySQL)

Aplicação web para jogo de cidade com frontend moderno e backend simples para autenticação por sessão e persistência em MySQL.

## Funcionalidades

- 40 equipas com login individual (`team01`...`team40`)
- 10 postos com PIN individual
- Registo único por combinação equipa-posto
- 50 pontos automáticos por presença + pontos extra de jogo (0 ou 100)
- Dashboard de equipa com estado visual dos postos (verde/vermelho) e pontuação em tempo real
- Dashboard admin com ranking em tempo real, histórico com data/hora e exportação CSV para Excel

## Stack

- Frontend: HTML + CSS + JavaScript
- Backend: Node.js + Express
- Base de dados: MySQL
- Sessão: `express-session`

## Setup rápido

1. Instalar dependências:

```bash
npm install
```

2. Configurar variáveis de ambiente:

```bash
cp .env.example .env
```

3. Criar esquema e dados iniciais no MySQL:

```bash
mysql -u root -p < backend/schema.sql
```

4. Arrancar servidor:

```bash
npm start
```

5. Abrir `http://localhost:4173`.

## Credenciais iniciais

- **Admin**: `admin` / `admin123`
- **Equipas**:
  - Utilizador: `team01` até `team40`
  - Palavra-passe: `city-01` até `city-40`

## Publicação

Para GitHub Pages puro não é possível executar backend Node/MySQL. Para produção deste projeto, publica em plataforma com suporte backend (ex.: Render, Railway, Fly.io, VPS) e aponta para MySQL gerido.
