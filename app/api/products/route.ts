import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PRODUCTS from "@/src/constants/products";
import { Product } from "@/src/types/product";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "products.json");

function ensureFileExists(): Product[] {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(PRODUCTS, null, 2), "utf-8");
    return PRODUCTS;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("Error reading products.json, resetting to defaults:", error);
  }

  fs.writeFileSync(filePath, JSON.stringify(PRODUCTS, null, 2), "utf-8");
  return PRODUCTS;
}

export async function GET() {
  const products = ensureFileExists();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const products = ensureFileExists();
    const body: Product = await request.json();

    if (!body || !body.name) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }

    const index = products.findIndex((p) => p.id === body.id);
    let updatedProducts: Product[];

    if (index >= 0) {
      updatedProducts = [...products];
      updatedProducts[index] = body;
    } else {
      updatedProducts = [body, ...products];
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2), "utf-8");
    return NextResponse.json(updatedProducts);
  } catch (error) {
    console.error("Failed to save product:", error);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const products = ensureFileExists();
    const updatedProducts = products.filter((p) => p.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2), "utf-8");
    return NextResponse.json(updatedProducts);
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
