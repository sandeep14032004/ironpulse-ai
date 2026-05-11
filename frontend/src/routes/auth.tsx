import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Lock, Mail, User as UserIcon } from "lucide-react";
import { loginUser, registerUser } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Account - IronPulse AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        return registerUser({ name: name.trim(), email: email.trim(), password });
      }
      return loginUser({ email: email.trim(), password });
    },
    onSuccess: async () => {
      setErrorText(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["workout-history"] }),
        queryClient.invalidateQueries({ queryKey: ["bodyweight-history"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics-daily"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics-weekly"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics-monthly"] }),
      ]);
      navigate({ to: "/" });
    },
    onError: (error: Error) => setErrorText(error.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    authMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-sm font-medium text-muted-foreground">
          Back
        </Link>

        <div className="mt-8 rounded-[2rem] border border-border bg-card p-6 shadow-elevated">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white">
            <Activity className="h-6 w-6" />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Mongo-backed account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your workouts, XP, streak, calories, bodyweight, and analytics will be stored separately for your account.
          </p>

          <div className="mt-5 inline-flex w-full rounded-2xl bg-secondary p-1">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === value ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                }`}
              >
                {value === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "register" && (
              <Field
                icon={<UserIcon className="h-4 w-4" />}
                placeholder="Full name"
                value={name}
                onChange={setName}
                type="text"
              />
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              placeholder="Email address"
              value={email}
              onChange={setEmail}
              type="email"
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              placeholder="Password"
              value={password}
              onChange={setPassword}
              type="password"
            />

            {errorText && <p className="text-sm text-destructive">{errorText}</p>}

            <button
              type="submit"
              disabled={authMutation.isPending}
              className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.99] disabled:opacity-70"
            >
              {authMutation.isPending
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type,
}: {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
    </label>
  );
}
