'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ImageIcon, ListTodoIcon, LogOutIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_LINKS = [
  { href: '/tasks', label: 'Tasks', icon: ListTodoIcon },
  { href: '/annotate', label: 'Annotate', icon: ImageIcon },
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
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <span className="shrink-0 text-sm font-semibold tracking-tight sm:text-base">
          Sketch &amp; Sprint
        </span>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-3',
                pathname.startsWith(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span className="hidden text-muted-foreground md:inline">
          {user.email}
        </span>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          aria-label="Log out"
        >
          <LogOutIcon />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
