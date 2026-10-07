import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="mb-8 text-center">
          <div className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">Voltmix</div>
          <p className="text-sm text-slate-500">Admin access</p>
        </div>

        <form id="login-form" className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>

      </div>
    </div>
  );
}

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <>
      <LoginForm />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('login-form')?.addEventListener('submit', async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = form.email.value;
              const password = form.password.value;
              const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              const data = await response.json();
              if (response.ok) {
                window.location.href = '/admin/dashboard';
              } else {
                alert(data.message || 'Login failed');
              }
            });
          `,
        }}
      />
    </>
  );
}
