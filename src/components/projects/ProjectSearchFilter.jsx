import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ProjectSearchFilter({ searchTerm, onSearchChange }) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
                type="text"
                placeholder="Buscar projetos por nome..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white"
            />
        </div>
    );
}