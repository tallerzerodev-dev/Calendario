export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <header className="relative overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500">
                Sistema serverless
              </span>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Agendamiento de clases con control total de cupos
              </h1>
            </div>
            <div className="rounded-full border border-gray-300 bg-white/80 px-4 py-2 text-sm text-gray-600 shadow-sm">
              Neon + Prisma + NextAuth
            </div>
          </div>
          <p className="max-w-2xl text-lg text-gray-600">
            Gestiona horarios semanales, reservas en tiempo real y saldo de clases con
            notificaciones automáticas al administrador. Diseñado para operar con flujo
            estricto en escala de grises y seguridad basada en roles.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              className="flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-900"
              href="/login"
            >
              Ingresar con Google
            </a>
            <a
              className="flex h-12 items-center justify-center rounded-full border border-gray-300 px-6 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
              href="/admin"
            >
              Ir al panel admin
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10">
        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Plantillas semanales",
              text: "Define bloques horarios recurrentes y genera cupos reales en segundos.",
            },
            {
              title: "Reservas transaccionales",
              text: "Evita duplicidad con transacciones SQL y validación estricta de créditos.",
            },
            {
              title: "Notificaciones seguras",
              text: "Alertas al admin vía Telegram con tolerancia a fallos de red.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50/60 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900">{feature.title}</h2>
              <p className="text-sm text-gray-600">{feature.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-semibold text-gray-900">Estado del proyecto</h3>
              <p className="text-sm text-gray-600">
                Configura credenciales y completa el onboarding para habilitar la
                administración.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Bootstrapping
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Configurar OAuth Google",
              "Crear whitelist inicial",
              "Inicializar plantillas semanales",
              "Definir créditos por alumno",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
