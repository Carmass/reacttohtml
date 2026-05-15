import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const val = row[h] ?? '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportToPDF(sections, title) {
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
                h2 { color: #4b5563; margin-top: 24px; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
                th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
                td { padding: 6px 8px; border: 1px solid #e5e7eb; }
                tr:nth-child(even) { background: #f9fafb; }
                .stat { display: inline-block; background: #ede9fe; padding: 8px 16px; border-radius: 8px; margin: 4px; }
                .stat-value { font-size: 20px; font-weight: bold; color: #7c3aed; }
                .stat-label { font-size: 11px; color: #6b7280; }
                .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p style="color:#6b7280; font-size:12px;">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
            ${sections.map(section => `
                <h2>${section.title}</h2>
                ${section.stats ? `<div>${section.stats.map(s => `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join('')}</div>` : ''}
                ${section.rows && section.rows.length > 0 ? `
                    <table>
                        <thead><tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>${section.rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                ` : '<p style="color:#9ca3af; font-size:12px;">Nenhum dado disponível</p>'}
            `).join('')}
            <div class="footer">React to HTML Compiler — Relatório gerado automaticamente</div>
        </body>
        </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

export default function DashboardExport({ builds, deployments, referrals, invoices, projects, collaborators }) {
    const [exporting, setExporting] = useState(false);

    const handleCSVExport = (type) => {
        setExporting(true);
        try {
            if (type === 'builds') {
                const data = (builds || []).map(b => ({
                    'Projeto': b.project_name,
                    'Status': b.status,
                    'Ferramenta AI': b.ai_tool || '',
                    'Duração (s)': b.build_duration || '',
                    'Data': new Date(b.created_date).toLocaleString('pt-BR')
                }));
                exportToCSV(data, 'builds.csv');
            } else if (type === 'deploys') {
                const data = (deployments || []).map(d => ({
                    'Projeto ID': d.project_id,
                    'Status': d.status,
                    'Repositório': d.repository_name || '',
                    'Duração (s)': d.duration || '',
                    'Erro': d.error_message || '',
                    'Data': new Date(d.created_date).toLocaleString('pt-BR')
                }));
                exportToCSV(data, 'deploys.csv');
            } else if (type === 'referrals') {
                const data = (referrals || []).map(r => ({
                    'Email Convidado': r.referred_email,
                    'Status': r.status,
                    'Créditos': r.reward_amount || 0,
                    'Data': new Date(r.created_date).toLocaleString('pt-BR')
                }));
                exportToCSV(data, 'indicacoes.csv');
            } else if (type === 'invoices') {
                const data = (invoices || []).map(i => ({
                    'Usuário': i.user_email,
                    'Plano': i.plan_name || '',
                    'Valor (R$)': ((i.amount || 0) / 100).toFixed(2),
                    'Status': i.status,
                    'Data': new Date(i.created_date).toLocaleString('pt-BR')
                }));
                exportToCSV(data, 'faturas.csv');
            } else if (type === 'all') {
                const data = [
                    ...(builds || []).map(b => ({ tipo: 'Build', nome: b.project_name, status: b.status, data: new Date(b.created_date).toLocaleString('pt-BR') })),
                    ...(deployments || []).map(d => ({ tipo: 'Deploy', nome: d.project_id, status: d.status, data: new Date(d.created_date).toLocaleString('pt-BR') })),
                    ...(referrals || []).map(r => ({ tipo: 'Indicação', nome: r.referred_email, status: r.status, data: new Date(r.created_date).toLocaleString('pt-BR') })),
                    ...(invoices || []).map(i => ({ tipo: 'Fatura', nome: i.user_email, status: i.status, data: new Date(i.created_date).toLocaleString('pt-BR') })),
                ];
                exportToCSV(data, 'relatorio-completo.csv');
            }
        } finally {
            setExporting(false);
        }
    };

    const handlePDFExport = () => {
        setExporting(true);
        const successBuilds = (builds || []).filter(b => b.status === 'completed').length;
        const failedBuilds = (builds || []).filter(b => b.status === 'failed').length;
        const successDeploys = (deployments || []).filter(d => d.status === 'success').length;
        const failedDeploys = (deployments || []).filter(d => d.status === 'failed').length;
        const rewardedRefs = (referrals || []).filter(r => r.status === 'rewarded').length;
        const totalRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0) / 100;

        const sections = [
            {
                title: 'Resumo Geral',
                stats: [
                    { label: 'Total Builds', value: (builds || []).length },
                    { label: 'Builds OK', value: successBuilds },
                    { label: 'Builds Falhados', value: failedBuilds },
                    { label: 'Total Deploys', value: (deployments || []).length },
                    { label: 'Deploys OK', value: successDeploys },
                    { label: 'Deploys Falhados', value: failedDeploys },
                    { label: 'Indicações Recompensadas', value: rewardedRefs },
                    { label: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}` },
                ],
                headers: [],
                rows: []
            },
            {
                title: 'Histórico de Builds',
                headers: ['Projeto', 'Status', 'Ferramenta AI', 'Duração (s)', 'Data'],
                rows: (builds || []).slice(0, 50).map(b => [b.project_name, b.status, b.ai_tool || '-', b.build_duration || '-', new Date(b.created_date).toLocaleString('pt-BR')])
            },
            {
                title: 'Histórico de Deploys',
                headers: ['Projeto ID', 'Status', 'Repositório', 'Duração (s)', 'Data'],
                rows: (deployments || []).slice(0, 50).map(d => [d.project_id, d.status, d.repository_name || '-', d.duration || '-', new Date(d.created_date).toLocaleString('pt-BR')])
            },
            {
                title: 'Indicações',
                headers: ['Email Convidado', 'Status', 'Créditos', 'Data'],
                rows: (referrals || []).slice(0, 50).map(r => [r.referred_email, r.status, r.reward_amount || 0, new Date(r.created_date).toLocaleString('pt-BR')])
            },
            {
                title: 'Faturas',
                headers: ['Usuário', 'Plano', 'Valor', 'Status', 'Data'],
                rows: (invoices || []).slice(0, 50).map(i => [i.user_email, i.plan_name || '-', `R$ ${((i.amount || 0) / 100).toFixed(2)}`, i.status, new Date(i.created_date).toLocaleString('pt-BR')])
            }
        ];

        exportToPDF(sections, 'Relatório do Dashboard');
        setExporting(false);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={exporting}>
                    <Download className="w-4 h-4" />
                    Exportar Relatório
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePDFExport} className="gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    Exportar PDF (Completo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCSVExport('all')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Exportar CSV (Tudo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCSVExport('builds')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    CSV — Builds
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCSVExport('deploys')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-violet-500" />
                    CSV — Deploys
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCSVExport('referrals')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-pink-500" />
                    CSV — Indicações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCSVExport('invoices')} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    CSV — Faturas
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}