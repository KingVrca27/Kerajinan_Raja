import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");

        if (!search || search.trim().length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Parameter search minimal 2 karakter",
                },
                { status: 400 }
            );
        }

        const apiKey = process.env.RAJAONGKIR_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    message: "RAJAONGKIR_API_KEY belum dikonfigurasi",
                },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${encodeURIComponent(
                search.trim()
            )}`,
            {
                method: "GET",
                headers: {
                    key: apiKey,
                },
            }
        );

        const result = await response.json();

        if (!response.ok || result?.meta?.code !== 200) {
            return NextResponse.json(
                {
                    success: false,
                    message: result?.meta?.message || "Gagal mencari destination",
                },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Destination search error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat mencari destination",
            },
            { status: 500 }
        );
    }
}