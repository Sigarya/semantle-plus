
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";

const History = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">היסטורית משחקים</h2>
          <HistoryPanel />
        </div>
      </main>
      <footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
        סמנטעל + &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default History;
