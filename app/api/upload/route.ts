import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT!,
      region: "fra1",
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_KEY!,
      },
      forcePathStyle: true,
    });

    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const contentType = file.type || "image/jpeg";

    const uploadParams = {
      Bucket: "isce-image",
      Key: uniqueFileName,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: contentType,
      ACL: "public-read" as ObjectCannedACL,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    const endpointHost = new URL(process.env.S3_ENDPOINT!).host; // Should be fra1.digitaloceanspaces.com
    if (!endpointHost) {
      throw new Error("Failed to parse S3_ENDPOINT host");
    }

    const imageUrl = `https://${uploadParams.Bucket}.${endpointHost}/${uniqueFileName}`;

    //console.log("Upload Params:", imageUrl);

    return NextResponse.json({ success: true, url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
