import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ddqlxhbqpivdsrsknwjy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qg5Aj0ZWARpyFRVEBtXRRg_rTB6WM3N';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  : null;

/**
 * Universal broadcast channel for cross-device state synchronization
 * Even when PostgreSQL tables are still syncing, WebSockets push state instantly.
 */
let broadcastChannel = null;

export function getBroadcastChannel() {
  if (!isSupabaseConfigured || !supabase) return null;
  if (!broadcastChannel) {
    broadcastChannel = supabase.channel('erp-sync-broadcast', {
      config: { broadcast: { self: false } },
    });
    broadcastChannel.subscribe((status) => {
      console.log(`[Supabase Broadcast Channel]: ${status}`);
    });
  }
  return broadcastChannel;
}

/**
 * Broadcast an immediate state change event to every active device/session
 */
export async function broadcastStateUpdate(scope, payload) {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      await channel.send({
        type: 'broadcast',
        event: 'state_mutation',
        payload: {
          scope,
          data: payload,
          timestamp: Date.now()
        }
      });
      console.log(`[Broadcast Sent]: ${scope}`);
    } catch (err) {
      console.warn('[Broadcast Error]:', err);
    }
  }
}

/**
 * Upload branding assets (logos, avatars, wallpapers) to Supabase Storage with cache busting
 */
export async function uploadBrandingAssetToSupabase(file, folder = 'branding') {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet');
  }

  const fileExt = file.name ? file.name.split('.').pop() : 'png';
  const cleanFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // 1. Upload to public bucket 'erp-assets'
  const { data, error } = await supabase.storage
    .from('erp-assets')
    .upload(cleanFileName, file, {
      cacheControl: '0', // No cache on storage side
      upsert: true,
      contentType: file.type || 'image/png'
    });

  if (error) {
    console.error('[Supabase Storage Upload Error]:', error);
    throw error;
  }

  // 2. Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from('erp-assets')
    .getPublicUrl(cleanFileName);

  // Return public URL with timestamp cache-buster query parameter
  return `${publicUrlData.publicUrl}?t=${Date.now()}`;
}

/**
 * Persist updated company configuration directly into Supabase PostgreSQL
 */
export async function saveCompanyConfigToSupabase(config) {
  if (!isSupabaseConfigured || !supabase) return { ok: false };

  try {
    const payload = {
      id: 'default',
      name: config.name,
      subtitle: config.subtitle,
      leader: config.leader,
      leader_title: config.leaderTitle,
      currency: config.currency,
      tax_rate: Number(config.taxRate) || 8.5,
      logo_url: config.logoUrl,
      banner_url: config.bannerUrl,
      login_bg_url: config.loginBgUrl,
      login_avatar_url: config.loginAvatarUrl,
      login_title: config.loginTitle,
      login_subtitle: config.loginSubtitle,
      theme: config.theme,
      sound_enabled: config.soundEnabled ? 1 : 0,
      current_role: config.currentRole,
      tile_names: JSON.stringify(config.tileNames || {}),
      module_themes: JSON.stringify(config.moduleThemes || {}),
      splash_config: JSON.stringify(config.splashConfig || {}),
      team_mode_permissions: JSON.stringify(config.teamModePermissions || {}),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('company_config')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Config Save Error]:', error.message);
      return { ok: false, error: error.message };
    }

    // Immediately trigger websocket broadcast to all other sessions
    await broadcastStateUpdate('company_config', payload);

    return { ok: true, data };
  } catch (err) {
    console.warn('[Supabase Exception]:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Persist collection (inventory, tasks, projects, etc.) to Supabase PostgreSQL & broadcast
 */
export async function syncCollectionToSupabase(table, items) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(items)) return { ok: false };

  try {
    const { data, error } = await supabase
      .from(table)
      .upsert(items, { onConflict: 'id' });

    if (!error) {
      await broadcastStateUpdate(table, items);
    }
    return { ok: !error, error: error?.message };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
