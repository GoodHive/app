import { S3, PutObjectCommand, GetObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { generateFileKeyName } from "@/app/utils/generate-file-key-name";

export async function POST(request: Request) {
  try {
    const { file, fileType } = await request.json();

    const s3 = new S3({
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || "",
        secretAccessKey: process.env.B2_APP_KEY || "",
      },
      endpoint: process.env.B2_ENDPOINT || "",
      region: process.env.B2_REGION || "",
    });

    const bucketName = process.env.B2_BUCKET || "";
    const keyName = generateFileKeyName(fileType);

    // Decode the Base64 file back to binary data
    const base64Data = file.replace(/^data:.*,/, '');
    const decodedFile = Buffer.from(base64Data, 'base64');

    const putObjectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: decodedFile,
      ACL: ObjectCannedACL.public_read,
      ContentType: fileType,
    };

    try {
      await s3.send(new PutObjectCommand(putObjectParams));
    } catch (error) {
      console.error(error);
    }

    const getObjectParams = {
      Bucket: bucketName,
      Key: keyName,
    };

    const hostB2 = process.env.B2_HOST || "";

    try {
      await s3.send(new GetObjectCommand(getObjectParams));
      const url = `https://${bucketName}.${hostB2}/${keyName}`;

      return new Response(JSON.stringify({ fileUrl: url }));
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}
