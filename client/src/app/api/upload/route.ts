import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { toast } from '@/hooks/use-toast';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || !process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET) {
            return NextResponse.json(
                { error: 'Missing required Cloudinary configuration' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an image.' },
                { status: 400 }
            );
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: folder,
                    transformation: [
                        { width: 500, height: 500, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        }).catch(error => {
            console.error('Cloudinary upload stream error:', error);
            throw new Error('Failed to upload image to Cloudinary');
        });

        return NextResponse.json({
            secure_url: (uploadResult as any).secure_url,
            public_id: (uploadResult as any).public_id,
            width: (uploadResult as any).width,
            height: (uploadResult as any).height,
        });

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        toast({ title: "Upload Failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
        return NextResponse.json(
            { error: 'Failed to upload image to Cloudinary' },
            { status: 500 }
        );
        
    }
}