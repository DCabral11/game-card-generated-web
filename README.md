# City Game Card (GitHub Pages)

Aplicação web estática pronta para publicar no GitHub Pages, criada para gerir um jogo de cidade com:

- 40 equipas com login individual (`team01`...`team40`)
- 10 postos com PIN individual
- Registo único por combinação equipa-posto
- 50 pontos automáticos por presença + pontos extra de jogo (0 ou 100)
- Dashboard de equipa com estado visual dos postos (verde/vermelho)
- Dashboard de administração com ranking em tempo real, histórico e exportação CSV para Excel

## Como executar localmente

```bash
python3 -m http.server 4173
```

Depois abre `http://localhost:4173`.

## Credenciais

- **Admin**: `admin` / `admin123`
- **Equipas**:
  - Utilizador: `team01` até `team40`
  - Palavra-passe: `city-01` até `city-40`

## Publicar no GitHub Pages

1. Faz push da branch para GitHub.
2. Vai a **Settings → Pages**.
3. Em **Build and deployment**, seleciona:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (ou outra branch), pasta `/root`
4. Guarda. O site fica disponível no URL fornecido pelo GitHub.

## Persistência dos dados

Como é um projeto GitHub Pages (estático), os dados ficam em `localStorage` no browser:

- Registos: `citygame.records.v1`
- Sessão ativa: `sessionStorage` em `citygame.session`

> Para produção multi-dispositivo real, substitui por backend (API + base de dados central).
