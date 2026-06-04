import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <span>إنشاء</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
          >
            المشاريع
          </Link>
          <Link
            to="/contact"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
          >
            تواصل بنا
          </Link>
        </nav>
      </div>
    </header>
  );
}
