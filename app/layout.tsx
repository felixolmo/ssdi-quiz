import "./globals.css";

export const metadata = {
  title: "Cuestionario de Elegibilidad SSDI/SSI",
  description: "Responde unas preguntas para evaluar tu elegibilidad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
