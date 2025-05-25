
import HistoryPanel from "@/components/HistoryPanel";
import PageLayout from "@/components/PageLayout";

const History = () => {
  return (
    <PageLayout title="היסטורית משחקים">
      <div className="max-w-3xl mx-auto mb-6 p-4 bg-primary-50 dark:bg-slate-800 rounded-md border border-primary-200 dark:border-slate-700 text-center">
        <p className="text-primary-800 dark:text-primary-300">
          רוצים לנסות שוב? פספסתם יום? כאן תוכלו לשחק בגרסאות קודמות של המשחק היומי. 
          המילים עד 24 במאי 2025 לקוחות מתוך המשחק המקורי. 
          החל מ-25 במאי, בכל יום מחכה לכם מילה חדשה לגמרי.
        </p>
      </div>
      <HistoryPanel />
    </PageLayout>
  );
};

export default History;
