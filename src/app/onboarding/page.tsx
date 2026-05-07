import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  async function updateName(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      throw new Error("Nombre requerido");
    }

    await prisma.user.update({
      where: { email: session.user.email ?? "" },
      data: { name },
    });

    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-gray-900">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
          Bienvenida
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Completa tu perfil</h1>
        <p className="mt-2 text-sm text-gray-600">
          Necesitamos tu nombre para habilitar el panel de reservas.
        </p>
        <form action={updateName} className="mt-8 flex flex-col gap-4">
          <input
            name="name"
            placeholder="Nombre completo"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Guardar y continuar
          </button>
        </form>
      </div>
    </div>
  );
}
