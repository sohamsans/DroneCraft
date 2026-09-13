import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DroneCraft | Intelligent Multirotor Physics & Genetic Optimizer",
  description: "Next-gen aerodynamic BEMT simulation, deterministic diagnostics, and multi-objective Pareto optimizer for multirotor drones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#070a12] text-slate-100 selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
