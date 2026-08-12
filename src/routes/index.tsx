import { createFileRoute } from "@tanstack/react-router";
import SceneExperience from "@/components/lut/SceneExperience";

const title = "LUT Studios — Every Frame Is a Painting | Creative Production Studio";
const description = "LUT Studios is a multidisciplinary creative production studio based in Yerevan, Armenia. We specialize in VFX, CGI, animation, commercial production, and sound design — merging high art with high tech.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SceneExperience />;
}
