import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUD_NAME! as string;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY! as string;
const cloudinarySecret = process.env.CLOUDINARY_API_SECRET! as string;

cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinarySecret
});


const uploadRoomQRCode = async(base64Image: string, roomId: string)=>{
    const upload = await cloudinary.uploader.upload(base64Image, {
        resource_type: 'image',
        public_id: roomId
    });

    return upload.secure_url;
}
export const CloudinaryService = {
    uploadRoomQRCode
}

