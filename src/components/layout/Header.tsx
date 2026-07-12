'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_LINKS = [
  { href: '/tasks', label: 'Tasks' },
  { href: '/annotate', label: 'Annotate' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/95 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-6">
        <span className="font-semibold tracking-tight">Sketch &amp; Sprint</span>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-muted-foreground sm:inline">
          {user.email}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
