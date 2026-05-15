import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, Clock, Edit, ExternalLink, Settings, Trash2, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProjectDetailsCard({ project, lastBuild, onEdit, onDelete, onAssociateBuilds, onViewDetails, onManageTeam }) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={onEdit}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Projeto
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="cursor-pointer"
                                asChild
                            >
                                <Link to={createPageUrl(`ProjectDetails?id=${project.id}&tab=ftp`)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Configurar FTP
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={onAssociateBuilds}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Associar Builds
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={onManageTeam}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Gerenciar Equipe
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-red-600 cursor-pointer"
                                onClick={onDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* AI Tool */}
                {project.selected_ai_tool && (
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-sm text-gray-600">Ferramenta AI:</span>
                        <Badge variant="outline" className="font-normal">
                            {project.selected_ai_tool}
                        </Badge>
                    </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Criado em:</span>
                    <span className="text-sm font-medium">
                        {format(new Date(project.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                </div>

                {/* Last Build */}
                {lastBuild && (
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Último build:</span>
                        <span className="text-sm font-medium">
                            {format(new Date(lastBuild.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <Badge className={
                            lastBuild.status === 'completed' ? 'bg-green-500' :
                            lastBuild.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                        }>
                            {lastBuild.status}
                        </Badge>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline" onClick={onViewDetails}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Detalhes Completos
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}