import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProducts, saveProducts } from "@/lib/dataStore";
import type { Product } from "@/data/products";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ success: true, products }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let updatedProducts: Product[];

    if (Array.isArray(body)) {
      updatedProducts = body;
    } else if (body.products && Array.isArray(body.products)) {
      updatedProducts = body.products;
    } else if (body.name) {
      const current = await getProducts();
      updatedProducts = [...current, body];
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
