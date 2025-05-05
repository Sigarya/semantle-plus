
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";

const History = () => {
  return (
    <div className="min-h-screen flex flex-col bg-semantle-dark">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-semantle-accent mb-8">היסטורית משחקים</h2>
          <HistoryPanel />
        </div>
      </main>
      <footer className="p-4 border-t border-semantle-primary text-center text-sm text-muted-foreground">
        סמנטל עברית יומי &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default History;
