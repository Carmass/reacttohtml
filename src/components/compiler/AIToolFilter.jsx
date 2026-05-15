import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const AI_TOOLS = [
    'Base44 (base44.ai)',
    'GPT (OpenAI)',
    'Google AI Studio',
    'Claude (claude.ai)',
    'Lovable (lovable.dev)',
    'Bolt.new (stackblitz.com)',
    'Replit Agent (replit.com)',
    'Marblism (marblism.com)',
    'DhiWise (dhiwise.com)',
    'Softgen (softgen.ai)',
    'Emergent (emergent.ai)',
    'GPT-Engineer (gptengineer.app)',
    'Pythagora (pythagora.ai)',
    'Create.xyz (create.xyz)',
    'v0 (v0.dev)',
    'Tempo (tempo.labs)',
    'Locofy.ai (locofy.ai)',
    'Anima (animaapp.com)',
    'Kombai (kombai.com)',
    'TeleportHQ (teleporthq.io)',
    'Plasmic (plasmic.app)',
    'Relume (relume.io)',
    'Quest AI (quest.ai)',
    'Bifrost (bifrost.so)',
    'Dualite (dualite.ai)',
    'Uizard (uizard.io)',
    'Cursor (cursor.com)',
    'Windsurf (codeium.com/windsurf)',
    'Builder.io (builder.io)',
    'Reweb (reweb.so)'
];

export default function AIToolFilter({ selectedTool, onToolChange, buildsCount }) {
    return (
        <div className="flex flex-col gap-3 w-full">
            <Select value={selectedTool || 'all'} onValueChange={onToolChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        Todas as ferramentas
                        {buildsCount !== undefined && (
                            <Badge variant="secondary" className="ml-2">{buildsCount}</Badge>
                        )}
                    </SelectItem>
                    {AI_TOOLS.map((tool) => (
                        <SelectItem key={tool} value={tool}>
                            {tool}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}