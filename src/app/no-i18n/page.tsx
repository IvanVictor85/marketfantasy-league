export default function HomePageNoI18n() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Market Fantasy League
        </h1>
        <p className="text-xl text-center text-muted-foreground mb-8">
          Fantasy sports meets market trading - Build your dream portfolio and compete with friends!
        </p>
        <div className="text-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg mr-4">
            Começar a Jogar
          </button>
          <button className="border border-primary text-primary px-6 py-3 rounded-lg">
            Ver Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
