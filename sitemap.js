export default function sitemap() {
  return [
    {
      url: "https://apxfitness.vercel.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://apxfitness.vercel.app/bilan",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
