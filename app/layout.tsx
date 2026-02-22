export const metadata = {
  title: 'DG Rental Solutions',
  description: 'Plataforma de gestión de flota para DG Rental Solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
