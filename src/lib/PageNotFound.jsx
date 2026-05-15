import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
      <div className="max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-9xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-purple-600 mx-auto rounded-full mt-4" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Página Não Encontrada</h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            A página <span className="font-semibold text-violet-600">"{pageName}"</span> não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all"
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            Página Anterior
          </button>
        </div>
      </div>
    </div>
  );
}
