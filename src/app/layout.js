import './globals.css'

export const metadata = {
  title: 'Government Funds Management',
  description: 'A decentralized platform for managing government funds and spending',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
