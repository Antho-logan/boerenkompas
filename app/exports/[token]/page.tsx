import { notFound } from 'next/navigation';
import { createServiceSupabaseClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const TOKEN_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ExportSharePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    
    if (!token || !TOKEN_REGEX.test(token)) {
        notFound();
    }

    let exportRecord: { index_html: string; expires_at: string | null } | null = null;

    try {
        const supabase = createServiceSupabaseClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('exports')
            .select('index_html, expires_at')
            .eq('share_token', token)
            .gte('expires_at', now)
            .single();

        if (error || !data) {
            notFound();
        }

        exportRecord = data;
    } catch {
        notFound();
    }

    if (!exportRecord?.expires_at || new Date(exportRecord.expires_at) < new Date()) {
        notFound();
    }

    return (
        <div
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: exportRecord.index_html }}
        />
    );
}
