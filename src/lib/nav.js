export const MAIN_PAGES = ['compiler', 'dashboard', 'projects', 'plans', 'referrals', 'support', 'profile', 'blog', 'blog-manage', 'testimonials', 'notifications', 'admin'];

export const NAV_LINKS = [
  { id: 'dashboard', i: '📊', l: 'Dashboard' },
  { id: 'projects',  i: '📁', l: 'Projetos' },
  { id: 'referrals', i: '🎁', l: 'Indicações' },
  { id: 'plans',     i: '💳', l: 'Planos' },
  { id: 'support',   i: '💬', l: 'Suporte' },
];

export const PAGE_META = {
  compiler:          { ico: '⚡', title: 'Compilador', sub: 'Compile seus projetos React em HTML estático', grad: 'linear-gradient(135deg,#7C3AED,#4F46E5)' },
  dashboard:         { ico: '📊', title: 'Dashboard', sub: 'Acompanhe suas compilações', grad: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
  projects:          { ico: '📁', title: 'Meus Projetos', sub: 'Gerencie seus projetos React to HTML', grad: 'linear-gradient(135deg,#7C3AED,#9333EA)' },
  'project-details': { ico: '📁', title: 'Detalhes do Projeto', sub: 'Informações e deployments', grad: 'linear-gradient(135deg,#7C3AED,#9333EA)' },
  'build-details':   { ico: '⚡', title: 'Detalhes do Build', sub: 'Progresso e logs', grad: 'linear-gradient(135deg,#F59E0B,#D97706)' },
  plans:             { ico: '💳', title: 'Gerenciar Plano', sub: 'Escolha o plano ideal para você', grad: 'linear-gradient(135deg,#10B981,#059669)' },
  profile:           { ico: '👤', title: 'Meu Perfil', sub: 'Gerencie sua informação pessoal', grad: 'linear-gradient(135deg,#7C3AED,#4F46E5)' },
  referrals:         { ico: '🎁', title: 'Indicações', sub: 'Indique amigos e ganhe créditos extras', grad: 'linear-gradient(135deg,#EC4899,#DB2777)' },
  support:           { ico: '💬', title: 'Suporte', sub: 'Central de suporte com IA', grad: 'linear-gradient(135deg,#6366F1,#4F46E5)' },
  admin:             { ico: '🛡️', title: 'Painel Admin', sub: 'Gerencie todo o sistema', grad: 'linear-gradient(135deg,#374151,#111827)' },
  blog:              { ico: '📝', title: 'Blog', sub: 'Artigos e tutoriais', grad: 'linear-gradient(135deg,#F97316,#EA580C)' },
  'blog-post':       { ico: '📝', title: 'Post', sub: '', grad: 'linear-gradient(135deg,#F97316,#EA580C)' },
  'blog-manage':     { ico: '✏️',  title: 'Gerenciar Blog', sub: 'Posts, categorias, tags e mais', grad: 'linear-gradient(135deg,#F97316,#EA580C)' },
  testimonials:      { ico: '⭐', title: 'Testemunhos', sub: 'Avalie sua experiência', grad: 'linear-gradient(135deg,#FBBF24,#D97706)' },
  notifications:     { ico: '🔔', title: 'Notificações', sub: 'Todas as suas notificações', grad: 'linear-gradient(135deg,#6366F1,#4F46E5)' },
};

export const TITLES = Object.fromEntries(Object.entries(PAGE_META).map(([k, v]) => [k, v.title]));

// Legacy compat: NAV exported for any code that still imports it
export const NAV = [
  {
    label: 'Principal',
    items: [
      { id: 'compiler',  i: '⚡', l: 'Compilador' },
      { id: 'dashboard', i: '📊', l: 'Dashboard' },
      { id: 'projects',  i: '📁', l: 'Projetos' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { id: 'plans',     i: '💳', l: 'Planos' },
      { id: 'profile',   i: '👤', l: 'Perfil' },
      { id: 'referrals', i: '🎁', l: 'Indicações' },
      { id: 'support',   i: '💬', l: 'Suporte' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { id: 'blog', i: '📝', l: 'Blog' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'admin', i: '🛡', l: 'Painel Admin' },
    ],
  },
];
