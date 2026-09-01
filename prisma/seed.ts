import { config as loadEnv } from "dotenv";

// `tsx prisma/seed.ts` roda fora do carregamento de env do Next.js/Prisma CLI.
loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  // import() dinâmico garante que o env acima já foi carregado antes do
  // módulo do Prisma ler process.env.DATABASE_URL na construção do adapter
  // (imports estáticos seriam avaliados antes das chamadas de loadEnv acima).
  const { prisma } = await import("../src/lib/prisma");
  const { hashPassword } = await import("../src/lib/password");

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@loja.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "troque-esta-senha-123";

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: { email: adminEmail, passwordHash: await hashPassword(adminPassword) },
    });
    console.log(`Admin criado: ${adminEmail} / senha: ${adminPassword}`);
  } else {
    console.log(`Admin já existe: ${adminEmail}`);
  }

  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", storeName: "Norte", offerCountdownMinutes: 15 },
    update: {},
  });

  const productsCount = await prisma.product.count();
  if (productsCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Camiseta Oversized Preta",
          slug: "camiseta-oversized-preta",
          description: "Camiseta oversized 100% algodão, corte reto e caimento streetwear.",
          priceCents: 8990,
          image: "/placeholder-product.svg",
          images: [],
          badge: "NOVO",
          badgeColor: "#1db954",
          stock: 25,
          active: true,
          featured: true,
          sortOrder: 1,
          category: "Camisetas",
          installments: 3,
        },
        {
          name: "Moletom Canguru Cinza",
          slug: "moletom-canguru-cinza",
          description: "Moletom flanelado com capuz e bolso canguru, ideal para o dia a dia.",
          priceCents: 15990,
          image: "/placeholder-product.svg",
          images: [],
          badge: "DESTAQUE",
          badgeColor: "#1db954",
          stock: 12,
          active: true,
          featured: true,
          sortOrder: 2,
          category: "Moletons",
          installments: 3,
        },
        {
          name: "Boné Aba Reta Preto",
          slug: "bone-aba-reta-preto",
          description: "Boné aba reta ajustável com bordado frontal.",
          priceCents: 6990,
          image: "/placeholder-product.svg",
          images: [],
          stock: 40,
          active: true,
          featured: false,
          sortOrder: 3,
          category: "Acessórios",
        },
      ],
    });
    console.log("Produtos de exemplo criados.");
  }

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
