export const dynamic = "force-dynamic";

// Proxy vers Open Food Facts pour éviter les CORS et normaliser les données
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.replace(/\D/g, "");

  if (!code || code.length < 8) {
    return Response.json({ error: "Code-barres invalide." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
      {
        headers: { "User-Agent": "APXFITNESS/1.0 (contact@apxfitness.fr)" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) throw new Error(`OFF status ${res.status}`);
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return Response.json({ error: "Produit non trouvé dans la base Open Food Facts." }, { status: 404 });
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Taille de portion : utilise serving_size si dispo, sinon 100g
    const servingRaw = p.serving_size || "";
    const servingMatch = servingRaw.match(/(\d+(?:[.,]\d+)?)\s*g/i);
    const servingG = servingMatch ? parseFloat(servingMatch[1].replace(",", ".")) : 100;

    // Valeurs pour 100g
    const per100 = {
      calories:  Math.round(nutriments["energy-kcal_100g"] || nutriments["energy_100g"] / 4.184 || 0),
      proteines: Math.round((nutriments["proteins_100g"] || 0) * 10) / 10,
      glucides:  Math.round((nutriments["carbohydrates_100g"] || 0) * 10) / 10,
      lipides:   Math.round((nutriments["fat_100g"] || 0) * 10) / 10,
      fibres:    Math.round((nutriments["fiber_100g"] || 0) * 10) / 10,
    };

    // Valeurs pour la portion
    const ratio = servingG / 100;
    const perServing = {
      calories:  Math.round(per100.calories  * ratio),
      proteines: Math.round(per100.proteines * ratio * 10) / 10,
      glucides:  Math.round(per100.glucides  * ratio * 10) / 10,
      lipides:   Math.round(per100.lipides   * ratio * 10) / 10,
    };

    return Response.json({
      code,
      nom: p.product_name_fr || p.product_name || p.generic_name_fr || p.generic_name || "Produit inconnu",
      marque: p.brands || "",
      image: p.image_front_small_url || p.image_small_url || null,
      nutriscore: p.nutriscore_grade?.toUpperCase() || null,
      serving: servingG,
      servingLabel: p.serving_size || "100g",
      per100,
      perServing,
    });
  } catch (e) {
    if (e.name === "TimeoutError") {
      return Response.json({ error: "Open Food Facts ne répond pas. Réessaie." }, { status: 504 });
    }
    console.error("barcode error:", e.message);
    return Response.json({ error: "Erreur lors de la recherche du produit." }, { status: 500 });
  }
}
