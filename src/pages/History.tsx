
import HistoryPanel from "@/components/HistoryPanel";
import PageLayout from "@/components/PageLayout";

const History = () => {
  return (
    <PageLayout title="היסטורית משחקים">
      <div className="max-w-3xl mx-auto mb-6 p-4 bg-primary-50 dark:bg-slate-800 rounded-md border border-primary-200 dark:border-slate-700 text-center">
        <p className="text-primary-800 dark:text-primary-300">
          רוצים לנסות שוב? פספסתם את הסמנטעל אתמול? כאן תוכלו לשחק בגרסאות קודמות של המשחק היומי. <br>
        בכל יום קצת אחרי השעה 3:00 יעלה המשחק של אתמול ויוצג כאן ובדף הראשי.
        </p>
      </div>
      <HistoryPanel />
    </PageLayout>
  );
};

export default History;
