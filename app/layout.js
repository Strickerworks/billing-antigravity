import "./globals.css";

export const metadata = {
  title: "The Heritage Group",
  description: "Corporate portal and billing solutions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
