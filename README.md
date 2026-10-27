# Atelier Lume

Site de apresentação e gestão de cortinas dividido em dois projetos independentes:

- `Client/`: interface React com Vite.
- `Server/`: API Express e base de dados MySQL.

## Requisitos

- Node.js 18 ou superior
- MySQL 8 ou compatível
- npm

## Configuração

1. Em `Server/`, copie `.env.example` para `.env` e configure a ligação MySQL, `FRONTEND_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
2. Em `Client/`, copie `.env.example` para `.env` e configure `VITE_API_URL` com a URL da API.
3. Instale as dependências em cada pasta, executando `npm install` dentro de `Server/` e de `Client/`.
4. Em `Server/`, execute `npm run migrate` para criar a base e aplicar o esquema MySQL.
5. Inicie `npm run dev` em cada pasta, em dois terminais.
6. Abra `http://localhost:5173/admin` para entrar na administração. O acesso não aparece na navegação pública.

Por predefinição, a interface corre em `http://localhost:5173` e a API em `http://localhost:3001`. `Server/.env` usa `FRONTEND_URL` para autorizar a origem do cliente por CORS; `Client/.env` usa `VITE_API_URL` para enviar pedidos à API e carregar imagens guardadas em `Server/uploads/`. Ao alterar as variáveis do cliente, reinicie o Vite; para produção, defina `VITE_API_URL` antes de gerar o build.

## Servidor

O servidor está organizado em MVC:

- `Server/models/`: acesso à base de dados MySQL e modelos de produtos e administradores.
- `Server/controllers/`: autenticação e operações sobre produtos.
- `Server/routes/`: rotas HTTP da API.
- `Server/middleware/`: validação de sessões de administração.

A base de dados chama-se `bd_curtinas` por predefinição. `DB_NAME` define o nome, e `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD` configuram a ligação. O utilizador MySQL precisa de permissão para criar a base de dados e as tabelas. As migrações versionadas encontram-se em `Server/migrations/` e podem ser aplicadas com `npm run migrate`; o servidor também aplica automaticamente as migrações pendentes no arranque. Os dados iniciais de `Server/data/products.json` são importados apenas quando a tabela de produtos está vazia; a partir daí, a base de dados é a fonte de dados.

Na administração, **Informações do site** permite alterar os dados do negócio (nome, slogan, logótipo, favicon e contactos) e o texto e a imagem da apresentação principal. Os restantes textos e rótulos da loja mantêm-se fixos; as imagens e informações dos produtos são geridas na secção de produtos. Também é possível configurar a mensagem e o número de WhatsApp. As alterações ficam guardadas em MySQL e são refletidas na loja pública. O acesso administrativo é feito diretamente em `/admin`, sem botão na navegação pública.

Ao adicionar ou editar um produto, pode carregar uma imagem JPG, PNG, GIF ou WebP do computador (máximo de 5 MB); também continua a ser possível indicar um URL de imagem. Ao escolher a etiqueta **Promoção**, informe o preço anterior e o preço promocional (inferior ao anterior); ambos são apresentados na montra e as promoções com preço definido passam para a hero. Se não houver promoções válidas, a hero destaca os produtos marcados como **Novo**. Em produção, mantenha `Server/uploads/` num disco persistente e inclua-a nas cópias de segurança. Para mostrar o botão de WhatsApp, guarde o número com indicativo internacional, como `+244 923 000 000`.

As palavras-passe são armazenadas com hash e salt. Para produção, defina `NODE_ENV=production`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente do servidor. O utilizador de administração é criado na primeira inicialização da base de dados; as credenciais ficam associadas a essa conta e não são substituídas em reinícios posteriores.

## Produção

Gere o cliente com `npm run build` dentro de `Client/` e inicie a API com `npm start` dentro de `Server/`. O Express também pode servir o build de `Client/dist/` quando `NODE_ENV=production`; se o cliente for publicado noutro domínio, configure `VITE_API_URL` para a URL da API e `FRONTEND_URL` para a origem publicada do cliente. Publique o site através de HTTPS e utilize palavras-passe fortes em produção.
