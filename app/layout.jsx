import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata = {
  title: "Banorte GEN-AI · Asistente Financiero",
  description:
    "Asistente inteligente de Banorte para análisis de cuentas, reportes de pólizas y proyecciones de inversión en segundos.",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#eb0029",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} bg-banorte-gray-subtle`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
