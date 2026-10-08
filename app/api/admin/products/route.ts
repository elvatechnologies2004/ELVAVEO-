import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProducts, saveProducts } from "@/lib/dataStore";
import { requireAdminAuth, sanitizeSafeUrl } from "@/lib/security";
import type { Product } from "@/data/products";
import { z } from "zod";

const ProductInputSchema = z.object({
  id: z.string().trim().max(100).optional(),
  name: z.string().trim().min(1, "Product name is required").max(150),
  logo: z.string().trim().max(500).optional(),
  badge: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  headline: z.array(z.string().trim().max(200)).optional(),
  accentLine: z.number().int().min(0).max(5).optional(),
  description: z.string().trim().max(2000).optional(),
  cta: z.string().trim().max(100).optional(),
  stats: z
    .array(
      z.object({
        label: z.string().trim().max(100),
        value: z.string().trim().max(100),
        trend: z.string().trim().max(100).optional(),
      })
    )
    .optional(),
  accent: z.enum(["cyan", "violet"]).optional(),
  href: z.string().trim().max(500).optional(),
});

function normalizeProduct(raw: z.infer<typeof ProductInputSchema>, existingList: Product[] = []): Product {
  const name = raw.name;
  let id = raw.id ? raw.id.trim() : "";
  if (!id) {
    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "product";
    id = baseSlug;
    let counter = 1;
    while (existingList.some((p) => p.id === id)) {
      id = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Ensure safe URL protocol (reject javascript: or data: URIs)
  let href = raw.href || "";
  if (!href) {
    href = `https://${id}.elvaveo.com`;
  } else {
    href = sanitizeSafeUrl(href, `https://${id}.elvaveo.com`);
  }

  const headline =
    Array.isArray(raw.headline) && raw.headline.length > 0
      ? raw.headline
      : [name, "Next-Generation Intelligence"];

  const stats =
    Array.isArray(raw.stats) && raw.stats.length > 0
      ? raw.stats.map((s) => ({
          label: s.label || "Metric",
          value: s.value || "100%",
          trend: s.trend,
        }))
      : [
          { label: "Efficiency", value: "+45%", trend: "Active" },
          { label: "AI Insights", value: "Real-Time", trend: "Predictive" },
          { label: "Architecture", value: "Cloud SaaS", trend: "Fast" },
          { label: "Status", value: "Production", trend: "99.9%" },
        ];

  return {
    id,
    name,
    logo: sanitizeSafeUrl(raw.logo || "/brand/elvaveo-logo.3d7b3289.png", "/brand/elvaveo-logo.3d7b3289.png"),
    badge: raw.badge || "An ELVAVEO Product",
    category: raw.category || "AI & Automation",
    headline,
    accentLine: typeof raw.accentLine === "number" ? raw.accentLine : 1,
    description: raw.description || "",
    cta: raw.cta || "Learn More",
    stats,
    accent: raw.accent === "violet" ? "violet" : "cyan",
    href,
  };
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(
    { success: true, products },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    }
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const body = await request.json();
    let updatedProducts: Product[];
    const current = await getProducts();

    if (Array.isArray(body)) {
      const parsedList = z.array(ProductInputSchema).safeParse(body);
      if (!parsedList.success) {
        return NextResponse.json(
          { success: false, error: parsedList.error.issues[0]?.message || "Invalid product array" },
          { status: 400 }
        );
      }
      updatedProducts = parsedList.data.map((p) => normalizeProduct(p, current));
    } else if (body.products && Array.isArray(body.products)) {
      const parsedList = z.array(ProductInputSchema).safeParse(body.products);
      if (!parsedList.success) {
        return NextResponse.json(
          { success: false, error: parsedList.error.issues[0]?.message || "Invalid products list" },
          { status: 400 }
        );
      }
      updatedProducts = parsedList.data.map((p) => normalizeProduct(p, current));
    } else if (body.name) {
      const parsedSingle = ProductInputSchema.safeParse(body);
      if (!parsedSingle.success) {
        return NextResponse.json(
          { success: false, error: parsedSingle.error.issues[0]?.message || "Invalid product" },
          { status: 400 }
        );
      }
      const normalized = normalizeProduct(parsedSingle.data, current);
      const existingIdx = current.findIndex((p) => p.id === normalized.id);
      if (existingIdx >= 0) {
        updatedProducts = current.map((p, idx) => (idx === existingIdx ? normalized : p));
      } else {
        updatedProducts = [...current, normalized];
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid product payload" },
        { status: 400 }
      );
    }

    const saved = await saveProducts(updatedProducts);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist products data" },
        { status: 500 }
      );
    }

    try {
      revalidatePath("/products");
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json(
      { success: true, message: "Products updated successfully", products: updatedProducts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.authenticated) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Product id required" },
        { status: 400 }
      );
    }
    const current = await getProducts();
    const updated = current.filter((p) => p.id !== id);
    const saved = await saveProducts(updated);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to delete product" },
        { status: 500 }
      );
    }
    try {
      revalidatePath("/products");
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {}
    return NextResponse.json(
      { success: true, message: "Product deleted", products: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
