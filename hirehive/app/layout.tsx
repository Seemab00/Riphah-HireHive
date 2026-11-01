import "./globals.css";

// This text shows in the browser tab.
export const metadata = {
  title: "Riphah HireHive",
  description: "FYP open house system for Riphah International University",
};

// The layout wraps EVERY page of the site.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loads the font used in the mood board. If it fails, the browser uses its default font. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
