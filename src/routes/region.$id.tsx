import { createFileRoute, redirect } from "@tanstack/react-router";

const REGIONS = new Set(["ironclad", "slagtown", "blackspire", "brasswater", "veyra", "kingdom", "caverns", "library"]);

export const Route = createFileRoute("/region/$id")({
  beforeLoad: ({ params }) => {
    const id = String(params.id ?? "").toLowerCase();
    if (!REGIONS.has(id)) {
      throw redirect({ to: "/", search: { to: "map" } });
    }
    throw redirect({ to: "/", search: { to: "map", region: id } });
  },
});
