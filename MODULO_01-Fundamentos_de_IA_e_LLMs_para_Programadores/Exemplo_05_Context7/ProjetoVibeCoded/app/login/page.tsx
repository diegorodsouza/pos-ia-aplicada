"use client"

import { authClient } from "@/lib/auth-client"

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.86-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 7.15c.85 0 1.7.12 2.49.36 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.33 4.82-4.56 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.28 10.28 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  )
}

export default function LoginPage() {
  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/"
    })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/30">
        <h1 className="text-2xl font-semibold text-slate-900">Entrar ou Criar Conta</h1>
        <p className="mt-2 text-sm text-slate-600">Demo simples com Better Auth + GitHub.</p>

        <button
          onClick={handleLogin}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <GitHubIcon />
          Entrar com GitHub
        </button>
      </section>
    </main>
  )
}
