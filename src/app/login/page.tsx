import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          SKETCH_N_SNIP
        </h1>
        <p className="text-sm text-muted-foreground">
          Plan your tasks and annotate images in one place.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
