import "./globals.css";

export const metadata = {
  title: "GST Flow Demo - Async vs Sync Processing",
  description: "Demonstration of modernizing GST filing from synchronous to asynchronous architecture",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
