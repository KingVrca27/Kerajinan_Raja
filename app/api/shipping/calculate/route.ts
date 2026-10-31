import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { origin, destination, weight, courier = "jne" } = body;

        if (!origin || !destination || !weight) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Origin, destination, dan weight wajib diisi",
                },
                { status: 400 }
            );
        }

        if (Number(weight) <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Berat harus lebih dari 0 gram",
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

        const formData = new URLSearchParams();

        formData.append("origin", String(origin));
        formData.append("destination", String(destination));
        formData.append("weight", String(weight));
        formData.append("courier", String(courier));
        formData.append("price", "lowest");

        const response = await fetch(
            "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
            {
                method: "POST",
                headers: {
                    key: apiKey,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            }
        );

        const result = await response.json();

        if (!response.ok || result?.meta?.code !== 200) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        result?.meta?.message || "Gagal menghitung ongkos kirim",
                },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Shipping calculation error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat menghitung ongkos kirim",
            },
            { status: 500 }
        );
    }
}