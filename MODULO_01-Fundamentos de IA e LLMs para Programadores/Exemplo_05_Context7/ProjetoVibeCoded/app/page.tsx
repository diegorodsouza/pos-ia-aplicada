"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth-client"

export default function HomePage() {
  const { data, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
        <p className="text-slate-700">Carregando sessão...</p>
      </main>
    )
  }

  const user = data?.user

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/30">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hello World</h1>

        {user ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-slate-700">Logado como {user.email || user.name}</p>
            <div className="mt-4 flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={`Foto de ${user.name || "usuário"}`}
                  className="h-14 w-14 rounded-full border border-slate-300 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-700">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-900">Nome: {user.name || "Não informado"}</p>
                <p className="text-sm text-slate-600">E-mail: {user.email || "Não informado"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-slate-700">Você não está logado</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {!user ? (
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Ir para Login
            </Link>
          ) : (
            <button
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => window.location.reload()
                  }
                })
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sair
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
