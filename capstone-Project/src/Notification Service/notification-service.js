import { supabase } from '../../capstone-client'; // adjust this path to match where capstone-client.js actually lives

/**
 * READ — notifications addressed to the caller's role. RLS restricts
 * this to rows matching the signed-in superadmin's role (see
 * notification-table.sql); a teacher-facing equivalent can reuse this
 * same function once teacher-targeted notifications exist.
 */
export async function fetchNotifications() {
    const { data, error } = await supabase
        .from('notification')
        .select('notification_id, name, message, type, is_read, created_at')
        .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map((n) => ({
        id: n.notification_id,
        name: n.name,
        message: n.message,
        type: n.type,
        read: n.is_read,
        time: formatRelativeTime(n.created_at),
    }));
}

/** Marks one or more notifications as read. */
export async function markNotificationsRead(ids) {
    if (ids.length === 0) return;
    const { error } = await supabase.from('notification').update({ is_read: true }).in('notification_id', ids);
    if (error) throw error;
}

/** Deletes one or more notifications. */
export async function deleteNotifications(ids) {
    if (ids.length === 0) return;
    const { error } = await supabase.from('notification').delete().in('notification_id', ids);
    if (error) throw error;
}

/** "5 min ago" / "3 hr ago" / "2 days ago" style relative timestamp. */
function formatRelativeTime(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}