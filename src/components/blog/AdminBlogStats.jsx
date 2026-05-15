import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { FileText, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AdminBlogStats({ posts, comments }) {
  // Stat cards
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalComments = comments.length;
  const approvedComments = comments.filter(c => c.status === 'approved').length;

  // Category distribution
  const catMap = {};
  posts.forEach(p => {
    if (p.category_name) {
      catMap[p.category_name] = (catMap[p.category_name] || 0) + 1;
    }
  });
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Posts per month (last 6 months)
  const monthMap = {};
  posts.forEach(p => {
    if (p.published_date) {
      const key = format(new Date(p.published_date), 'MMM/yy', { locale: ptBR });
      monthMap[key] = (monthMap[key] || 0) + 1;
    }
  });
  const monthData = Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count }));

  // Top posts by views
  const topPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  // Views by post for bar chart
  const viewsData = topPosts.map(p => ({
    name: p.title.length > 25 ? p.title.slice(0, 25) + '…' : p.title,
    views: p.views || 0
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5 text-blue-600" />} label="Total de Posts" value={totalPosts} sub={`${publishedPosts} publicados · ${draftPosts} rascunhos`} color="blue" />
        <StatCard icon={<Eye className="w-5 h-5 text-emerald-600" />} label="Total de Visualizações" value={totalViews.toLocaleString()} sub="em todos os posts" color="emerald" />
        <StatCard icon={<MessageSquare className="w-5 h-5 text-amber-600" />} label="Comentários" value={totalComments} sub={`${approvedComments} aprovados`} color="amber" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Média de Views" value={totalPosts ? Math.round(totalViews / totalPosts) : 0} sub="por post" color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Views per post */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Top Posts por Visualizações</h3>
          {viewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={viewsData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Nenhum dado disponível</p>}
        </div>

        {/* Category distribution */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Posts por Categoria</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 truncate">{cat.name}</span>
                    <span className="ml-auto font-semibold text-gray-900">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-8">Nenhum dado disponível</p>}
        </div>
      </div>

      {/* Posts over time */}
      {monthData.length > 1 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Posts Publicados por Mês</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const bgMap = { blue: 'bg-blue-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', purple: 'bg-purple-50' };
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`w-9 h-9 rounded-lg ${bgMap[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}