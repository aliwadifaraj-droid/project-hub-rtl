export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-20">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} إنشاء — منصة عرض مشاريع المقاولات
      </div>
    </footer>
  );
}
