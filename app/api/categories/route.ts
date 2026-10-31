import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import CATEGORIES from "@/src/constants/categories";
import { Category } from "@/src/types/category";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "categories.json");

function ensureFileExists(): Category[] {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(CATEGORIES, null, 2), "utf-8");
    return CATEGORIES;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("Error reading categories.json, resetting to defaults:", error);
  }

  fs.writeFileSync(filePath, JSON.stringify(CATEGORIES, null, 2), "utf-8");
  return CATEGORIES;
}

export async function GET() {
  const categories = ensureFileExists();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const categories = ensureFileExists();
    const body: Category = await request.json();

    if (!body || !body.name) {
      return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
    }

    const index = categories.findIndex((c) => c.id === body.id);
    let updatedCategories: Category[];

    if (index >= 0) {
      updatedCategories = [...categories];
      updatedCategories[index] = body;
    } else {
      updatedCategories = [...categories, body];
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedCategories, null, 2), "utf-8");
    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error("Failed to save category:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const categories = ensureFileExists();
    const updatedCategories = categories.filter((c) => c.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(updatedCategories, null, 2), "utf-8");
    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
