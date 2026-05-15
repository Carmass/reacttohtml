import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotificationCenter({ user }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            return await base44.entities.Notification.filter(
                { user_id: user.id },
                '-created_date',
                20
            );
        },
        enabled: !!user?.id,
        refetchInterval: 10000
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId) => {
            return await base44.entities.Notification.update(notificationId, { read: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
            return Promise.all(
                unreadIds.map(id => base44.entities.Notification.update(id, { read: true }))
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (notificationId) => {
            return await base44.entities.Notification.delete(notificationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const getNotificationIcon = (type, status) => {
        const iconMap = {
            build: '🔨',
            deploy: '🚀',
            subscription: '💳',
            referral: '🎁',
            system: '⚙️'
        };
        return iconMap[type] || '📬';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            success: 'bg-green-100 text-green-800 border-green-200',
            error: 'bg-red-100 text-red-800 border-red-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            info: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colorMap[status] || colorMap.info;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
                <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-sm">Notificações</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            className="text-xs"
                        >
                            <Check className="w-3 h-3 mr-1" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <Bell className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg border transition-all ${
                                        notification.read 
                                            ? 'bg-gray-50 opacity-75' 
                                            : 'bg-white shadow-sm'
                                    } ${getStatusColor(notification.status)}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">
                                                    {getNotificationIcon(notification.type, notification.status)}
                                                </span>
                                                <h4 className="font-semibold text-sm truncate">
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-700 mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(notification.created_date).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {notification.link && (
                                                    <a
                                                        href={notification.link}
                                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                        onClick={() => {
                                                            if (!notification.read) {
                                                                markAsReadMutation.mutate(notification.id);
                                                            }
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        Ver detalhes
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsReadMutation.mutate(notification.id);
                                                    }}
                                                >
                                                    <Check className="w-3 h-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteMutation.mutate(notification.id);
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}