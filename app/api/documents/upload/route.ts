/**
 * Document Upload Route Handler
 * Handles file uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireUser } from '@/lib/supabase/server';
import { requireActiveTenant } from '@/lib/supabase/tenant';
import { createDocument } from '@/lib/supabase/actions/documents';

export async function POST(request: NextRequest) {
    try {
        const user = await requireUser();
        const tenant = await requireActiveTenant();
        const supabase = await createServerSupabaseClient();

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string | null;
        const category = formData.get('category') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Generate document ID and storage path
        const docId = crypto.randomUUID();
        const storagePath = `${tenant.id}/documents/${docId}/${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase
            .storage
            .from('documents')
            .upload(storagePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Create document record
        const document = await createDocument({
            id: docId,
            title: title || file.name.replace(/\.[^/.]+$/, ''),
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            storage_key: storagePath,
            category: category || 'onbekend',
            status: 'needs_review',
            tags: [],
        });

        return NextResponse.json({
            success: true,
            document
        });

    } catch (error) {
        console.error('Upload error:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
