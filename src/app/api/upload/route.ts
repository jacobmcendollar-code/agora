import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fileName, fileType, fileData } = body as {
      fileName?: string;
      fileType?: string;
      fileData?: string; // base64
    };

    if (!fileName || !fileType || !fileData) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    if (!fileType.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Convert base64 to File
    const buffer = Buffer.from(fileData, "base64");
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 4MB" }, { status: 400 });
    }

    const file = new File([buffer], fileName, { type: fileType });

    const results = await utapi.uploadFiles([file]);
    const result = results[0];

    if (!result || result.error || !result.data) {
      console.error("[upload] UTApi error:", result?.error);
      return NextResponse.json(
        {
          error:
            result?.error?.message ||
            "Upload failed. Check UPLOADTHING_TOKEN on Vercel.",
        },
        { status: 500 }
      );
    }

    const url = result.data.ufsUrl || result.data.url;
    if (!url) {
      return NextResponse.json({ error: "No URL returned from upload" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[upload] exception:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}