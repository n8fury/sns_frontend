'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="font-semibold">Sketch &amp; Sprint</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{user.email}</span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
