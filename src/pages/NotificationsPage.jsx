import { C } from '../lib/tokens.js';
import { useNotifications } from '../hooks/useDB.js';

const TYPE_ICONS = {
  build:    '⚡',
  payment:  '💳',
  referral: '🎁',
  system:   '⚙️',
  warning:  '⚠️',
};

export default function NotificationsPage({ go }) {
  const { data: notifs, markRead, markAllRead, refetch } = useNotifications();

  const unread = notifs.filter(n => !n.read).length;

  function groupByDate(items) {
    const groups = {};
    items.forEach(n => {
      const day = new Date(n.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups[day]) groups[day] = [];
      groups[day].push(n);
    });
    return groups;
  }

  const groups = groupByDate(notifs);

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.on }}>Notificações</h2>
          {unread > 0 && (
            <div style={{ fontSize: 13, color: C.onV, marginTop: 2 }}>
              {unread} não lida{unread !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        {unread > 0 && (
          <button className="btn bsm bt" onClick={markAllRead}>
            ✓ Marcar todas como lidas
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: 80 }}>
            <div className="empty-ico">🔔</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Sem notificações</div>
            <div style={{ fontSize: 13, color: C.onV }}>Você está em dia! As notificações aparecerão aqui.</div>
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.onV, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, padding: '0 4px' }}>
              {date}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((n, idx) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--ovV)' : 'none',
                    background: n.read ? 'transparent' : '#FAFAFF',
                    cursor: 'pointer',
                    transition: 'background .12s',
                  }}
                  onClick={() => markRead(n.id)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : '#FAFAFF'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: n.read ? 'var(--s1)' : 'var(--pC)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    {n.icon || TYPE_ICONS[n.type] || '🔔'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontWeight: n.read ? 600 : 700, fontSize: 13, color: C.on }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--p)', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: C.onV, lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Action */}
                  {!n.read && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onV, fontSize: 11, flexShrink: 0, paddingTop: 2 }}
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
