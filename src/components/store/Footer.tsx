import Image from "next/image";
import Link from "next/link";

export function Footer({ storeName, logoUrl }: { storeName: string; logoUrl?: string | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {logoUrl ? (
            <span className="relative block h-9 w-32">
              <Image src={logoUrl} alt={storeName} fill className="object-contain object-left" sizes="128px" />
            </span>
          ) : (
            <p className="text-lg font-black tracking-tight">{storeName.toUpperCase()}</p>
          )}
          <p className="mt-3 max-w-xs text-sm text-muted">
            Peças pensadas para quem constrói sua própria trajetória. Qualidade, atitude e entrega rápida
            para todo o Brasil.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Loja</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/produtos" className="hover:text-brand">Todos os produtos</Link></li>
            <li><Link href="/#produtos" className="hover:text-brand">Lançamentos</Link></li>
            <li><Link href="/#produtos" className="hover:text-brand">Destaques</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Minha conta</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/rastreio" className="hover:text-brand">Acompanhar pedido</Link></li>
            <li><Link href="/conta" className="hover:text-brand">Minha conta</Link></li>
            <li><Link href="/favoritos" className="hover:text-brand">Favoritos</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Suporte</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><span className="text-muted">Fale conosco</span></li>
            <li><span className="text-muted">Trocas e devoluções</span></li>
            <li><span className="text-muted">Política de privacidade</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
          <p>&copy; {year} {storeName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-border px-2 py-1">PIX</span>
            <span className="rounded-sm border border-border px-2 py-1">Pagamento seguro</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
