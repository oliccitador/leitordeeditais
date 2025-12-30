import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Página não encontrada
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    A página que você está procurando não existe ou foi movida.
                </p>
                <Link
                    href="/"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Voltar para o Início
                </Link>
            </div>
        </div>
    );
}
