import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Pièces jointes jusqu'à 10 Mo (+ marge pour l'encodage multipart)
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
