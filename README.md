# Atelier Lume

Site de apresentação e gestão de cortinas construído com React, Vite, Node.js e Express. O servidor está organizado em MVC e utiliza MySQL para guardar produtos e a conta de administração.

## Requisitos

- Node.js 18 ou superior
- MySQL 8 ou compatível
- npm

## Desenvolvimento

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env`.
3. Configure `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD` no `.env`.
4. Execute `npm run migrate` para criar a base `bd_curtinas` e aplicar o esquema MySQL.
5. Execute `npm run dev`.
6. Abra `http://localhost:5173/admin` para entrar na administração. O acesso não aparece na navegação pública.
7. Entre com `admin@gmail.com` e `admin123`.

Pode alterar as definições no `.env`. Sem variáveis de ambiente, estes dados de acesso são usados em desenvolvimento.

## Estrutura MVC

- `server/models/`: acesso à base de dados MySQL e modelos de produtos e administradores.
- `server/controllers/`: autenticação e operações sobre produtos.
- `server/routes/`: rotas HTTP da API.
- `server/middleware/`: validação de sessões de administração.

A base de dados MySQL chama-se `bd_curtinas` por predefinição. `DB_NAME` define o nome, e `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD` configuram a ligação. O utilizador MySQL precisa de permissão para criar a base de dados e as tabelas. As migrações versionadas encontram-se em `server/migrations/` e podem ser aplicadas com `npm run migrate`; o servidor também aplica automaticamente as migrações pendentes no arranque. Os dados iniciais de `server/data/products.json` são importados apenas quando a tabela de produtos está vazia; a partir daí, a base de dados é a fonte de dados.

Na administração, **Informações do site** permite alterar os dados do negócio (nome, slogan, logótipo, favicon e contactos) e o texto e a imagem da apresentação principal. Os restantes textos e rótulos da loja mantêm-se fixos; as imagens e informações dos produtos são geridas na secção de produtos. Também é possível configurar a mensagem e o número de WhatsApp. As alterações ficam guardadas em MySQL e são refletidas na loja pública. O acesso administrativo é feito diretamente em `/admin`, sem botão na navegação pública.

Ao adicionar ou editar um produto, pode carregar uma imagem JPG, PNG, GIF ou WebP do computador (máximo de 5 MB); também continua a ser possível indicar um URL de imagem. Ao escolher a etiqueta **Promoção**, informe o preço anterior e o preço promocional (inferior ao anterior); ambos são apresentados na montra e as promoções com preço definido passam para a hero. Se não houver promoções válidas, a hero destaca os produtos marcados como **Novo**. Os ficheiros carregados ficam em `server/uploads/`, servidos pelo site e ignorados pelo Git. Em produção, mantenha essa pasta num disco persistente e inclua-a nas cópias de segurança. Para mostrar o botão de WhatsApp, guarde o número com indicativo internacional, como `+244 923 000 000`.

Antes de executar os comandos, substitua `DB_PASSWORD` no `.env` pela palavra-passe do seu utilizador MySQL. O valor de exemplo não é uma credencial de acesso.

As palavras-passe são armazenadas com hash e salt. Para produção, defina `NODE_ENV=production`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente antes de iniciar. O utilizador de administração é criado na primeira inicialização da base de dados; as credenciais ficam associadas a essa conta e não são substituídas em reinícios posteriores.

## Produção

Execute `npm run build` e inicie com `NODE_ENV=production`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e as variáveis de ligação MySQL definidos. O Express serve a aplicação e a API na mesma origem. Publique o site através de HTTPS e utilize palavras-passe fortes em produção.
