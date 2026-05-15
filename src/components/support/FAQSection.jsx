import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        category: "Compilação",
        questions: [
            {
                q: "O que é o React to HTML Compiler?",
                a: "É uma ferramenta que converte projetos React em arquivos HTML estáticos, permitindo hospedagem em qualquer servidor web sem necessidade de Node.js."
            },
            {
                q: "Quais tipos de arquivo posso fazer upload?",
                a: "Você deve fazer upload de um arquivo ZIP contendo seu projeto React completo, incluindo package.json e todos os arquivos necessários."
            },
            {
                q: "Quanto tempo leva para compilar um projeto?",
                a: "O tempo varia de acordo com o tamanho do projeto, mas geralmente leva entre 2 a 5 minutos para projetos médios."
            },
            {
                q: "O que acontece se minha compilação falhar?",
                a: "Você receberá uma mensagem de erro detalhando o problema. Verifique se todos os arquivos estão corretos e tente novamente. Você pode consultar o histórico para ver detalhes do erro."
            },
            {
                q: "Posso recompilar um projeto anterior?",
                a: "Sim! No histórico de builds, você pode clicar em 'Recompilar' em qualquer projeto anterior para gerar uma nova versão."
            }
        ]
    },
    {
        category: "Arquivos e Downloads",
        questions: [
            {
                q: "Como faço download do arquivo compilado?",
                a: "Após a compilação bem-sucedida, clique no botão 'Baixar HTML Compilado' ou acesse o histórico e clique em 'Download' no build desejado."
            },
            {
                q: "Quanto tempo os arquivos ficam armazenados?",
                a: "Os arquivos ficam armazenados permanentemente em sua conta. Você pode acessá-los a qualquer momento através do histórico de builds."
            },
            {
                q: "Posso visualizar o arquivo original que enviei?",
                a: "Sim, no histórico de builds há um botão para visualizar/baixar o arquivo original que você enviou."
            },
            {
                q: "Qual o tamanho máximo de arquivo permitido?",
                a: "O tamanho máximo recomendado é de 100MB para o arquivo ZIP. Projetos maiores podem demorar mais para processar."
            }
        ]
    },
    {
        category: "Conta e Perfil",
        questions: [
            {
                q: "Como edito minhas informações pessoais?",
                a: "Acesse a página de Perfil através do menu do usuário no canto superior direito. Lá você pode editar nome, telefone, empresa e outras informações."
            },
            {
                q: "Posso alterar minha foto de perfil?",
                a: "Sim! Na página de Perfil, clique no avatar e selecione uma nova imagem. Formatos aceitos: JPG, PNG (máx. 5MB)."
            },
            {
                q: "Como faço para sair da minha conta?",
                a: "Clique no ícone do usuário no canto superior direito e selecione 'Sair'."
            },
            {
                q: "Posso excluir minha conta?",
                a: "Sim, na página de Perfil há uma opção 'Remover Conta' na seção Zona de Perigo. Esta ação é irreversível e remove todos os seus dados."
            }
        ]
    },
    {
        category: "Dashboard e Histórico",
        questions: [
            {
                q: "O que significa cada status no histórico?",
                a: "Processando: build em andamento. Concluído: sucesso. Falhou: erro na compilação. Você pode ver detalhes do erro clicando no item."
            },
            {
                q: "Como filtro meus builds por data?",
                a: "No Dashboard, use os filtros de 'Data Inicial' e 'Data Final' para visualizar builds em um período específico."
            },
            {
                q: "Posso ver estatísticas dos meus builds?",
                a: "Sim! O Dashboard mostra cards com total de builds, concluídos, falhados, tempo médio e gráficos de tendências e distribuição."
            },
            {
                q: "Como excluo um build do histórico?",
                a: "No histórico, clique no botão de ações do build desejado e selecione 'Excluir'. Confirme a ação na mensagem que aparecer."
            }
        ]
    },
    {
        category: "Problemas Técnicos",
        questions: [
            {
                q: "Meu projeto não compila. O que fazer?",
                a: "Verifique se: 1) O ZIP contém todos os arquivos necessários, 2) package.json está correto, 3) Não há erros no código. Consulte a mensagem de erro específica no histórico."
            },
            {
                q: "O download não está funcionando. Como resolver?",
                a: "Tente limpar o cache do navegador ou usar outro navegador. Se persistir, abra um ticket de suporte informando o ID do build."
            },
            {
                q: "Recebi notificação de erro mas não sei o motivo.",
                a: "Acesse o histórico de builds e clique no build que falhou. A mensagem de erro detalhada estará visível lá."
            },
            {
                q: "Como entro em contato com suporte técnico?",
                a: "Use a aba 'Chat de Suporte' para assistência imediata ou 'Abrir Ticket' para enviar uma solicitação detalhada por email."
            }
        ]
    }
];

export default function FAQSection() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (category, index) => {
        const key = `${category}-${index}`;
        setOpenItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const filteredFAQs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
            item =>
                item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.a.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    return (
        <div className="space-y-6">
            <Card className="border-2 border-violet-100">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Buscar em perguntas frequentes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 text-base"
                        />
                    </div>
                </CardContent>
            </Card>

            {filteredFAQs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">Nenhuma pergunta encontrada para "{searchTerm}"</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredFAQs.map((category, catIndex) => (
                        <Card key={catIndex} className="overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                                <CardTitle className="text-lg text-violet-700">{category.category}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {category.questions.map((item, index) => {
                                        const key = `${category.category}-${index}`;
                                        const isOpen = openItems[key];

                                        return (
                                            <div key={index} className="hover:bg-gray-50 transition-colors">
                                                <button
                                                    onClick={() => toggleItem(category.category, index)}
                                                    className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left"
                                                >
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900">{item.q}</h3>
                                                        <AnimatePresence>
                                                            {isOpen && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <p className="text-gray-600 mt-3 leading-relaxed">
                                                                        {item.a}
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <div className="pt-1">
                                                        {isOpen ? (
                                                            <ChevronUp className="w-5 h-5 text-violet-500" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}