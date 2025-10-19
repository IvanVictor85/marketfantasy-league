export default function ProvidersTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Teste com Todos os Providers
      </h1>
      <p className="text-xl text-center text-muted-foreground mb-8">
        Esta página usa todos os providers do layout original mas com Navbar simplificado
      </p>
      <div className="text-center">
        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg mr-4">
          Teste Providers
        </button>
      </div>
    </div>
  );
}
