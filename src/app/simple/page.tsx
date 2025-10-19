export default function SimpleHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Market Fantasy League
        </h1>
        <p className="text-xl text-center text-muted-foreground mb-8">
          Fantasy sports meets market trading
        </p>
        <div className="text-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg">
            Começar a Jogar
          </button>
        </div>
      </div>
    </div>
  );
}
