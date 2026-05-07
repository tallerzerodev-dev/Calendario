import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-gray-900">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
            Acceso seguro
          </div>
          <h1 className="text-3xl font-semibold">Ingresa a tu cuenta</h1>
          <p className="text-sm text-gray-600">
            Solo correos autorizados pueden acceder al sistema. Si tu correo no
            está en la whitelist, el acceso será rechazado.
          </p>
        </div>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </div>
  );
}
