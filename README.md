# Norte — loja virtual com checkout PIX

E-commerce em Next.js (App Router) com checkout PIX próprio, integração com a
BravoPay, painel administrativo e banco PostgreSQL via Prisma.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma ORM 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL
- Zod para validação
- bcryptjs + cookies HTTP-only para autenticação do admin
- Vitest para testes unitários

## 1. Instalação

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `BRAVOPAY_API_KEY` | Chave de API da BravoPay (**nunca** use `NEXT_PUBLIC_`) |
| `BRAVOPAY_BASE_URL` | Padrão: `https://bravopay.club/api/v1` |
| `ADMIN_SESSION_SECRET` | String aleatória longa para assinar o cookie de sessão do admin |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (usada em metadata/OG/sitemap) |

Gerar um `ADMIN_SESSION_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Banco de dados

```bash
npm run db:push      # aplica o schema no banco (bom para começar rápido)
# ou, para versionar migrations:
npm run db:migrate
```

## 3. Criar o primeiro admin e produtos de exemplo

```bash
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD="uma-senha-forte" npm run db:seed
```

Isso cria o usuário admin (se ainda não existir), as configurações padrão da
loja e 3 produtos de exemplo. Acesse `/admin/login` com o e-mail/senha
informados.

## 4. Rodando localmente

```bash
npm run dev
```

- Loja: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## 5. Testes

```bash
npm test
```

Cobrem validação de CPF/telefone, formatação monetária e os schemas Zod do
checkout/produtos (garantindo, por exemplo, que o preço nunca é aceito vindo
do cliente).

## 6. BravoPay

A integração fica isolada em `src/lib/bravopay.ts`, usada apenas em Route
Handlers server-side (`/api/checkout`, `/api/transactions/[id]`,
`/api/webhooks/bravopay`). A chave de API nunca chega ao navegador.

### Webhook

Cadastre no painel da BravoPay a URL de produção:

```
https://SEU_DOMINIO.com/api/webhooks/bravopay
```

O endpoint sempre revalida o status da transação diretamente na API da
BravoPay antes de marcar um pedido como pago (a documentação pública da
BravoPay não expõe, até o momento, um segredo de assinatura de webhook) e é
idempotente: reenvios do mesmo evento não duplicam a confirmação.

### `product_id` da BravoPay

Cada produto tem um campo opcional `productIdBravoPay`, editável em
`/admin/produtos`. Quando preenchido, é enviado como `product_id` na criação
da transação.

## 7. Painel administrativo

- `/admin/login` — autenticação (cookie HTTP-only assinado, expira em 8h)
- `/admin` — dashboard (pedidos gerados, valor gerado, pedidos pagos, vendas aprovadas)
- `/admin/pedidos` — listagem e exclusão (soft delete) de pedidos
- `/admin/produtos` — CRUD de produtos
- `/admin/configuracoes` — nome da loja, logo, duração do contador de oferta

## 8. GitHub

```bash
git add .
git commit -m "sua mensagem"
git push
```

## 9. Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente do projeto (mesmas do `.env.example`).
3. Adicione um banco Postgres em **Storage → Create Database** (Neon,
   Supabase, etc.) — a Vercel injeta `DATABASE_URL` automaticamente ao
   conectar o projeto ao banco.
4. Rode as migrations contra o banco de produção:
   ```bash
   npm run db:deploy
   ```
5. Cadastre a URL do webhook (`https://SEU_DOMINIO.com/api/webhooks/bravopay`)
   no painel da BravoPay.
6. Rode o seed para criar o primeiro admin em produção (com `DATABASE_URL`
   apontando para o banco de produção):
   ```bash
   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
   ```

## Estrutura do projeto

```
src/
  app/
    (store)/          páginas públicas da loja (home, produto, checkout, obrigado)
    admin/
      (auth)/login/    login do admin, sem sidebar
      (dashboard)/     dashboard, pedidos, produtos, configurações
    api/
      checkout/            cria pedido + transação PIX
      transactions/[id]/   polling de status
      webhooks/bravopay/   confirmação de pagamento
      admin/               CRUD autenticado do painel
  components/
    store/             Header, Footer, Hero, ProductCard, CheckoutClient...
    admin/             AdminShell, tabelas e formulários do painel
    ui/                Button, Badge (design system)
  lib/                 prisma, bravopay, sessão/admin, validações, UTM
  proxy.ts             protege as rotas /admin/* (renomeado de middleware no Next 16)
prisma/
  schema.prisma
  seed.ts
```
