
import HistoryPanel from "@/components/HistoryPanel";
import PageLayout from "@/components/PageLayout";

const History = () => {
  return (
    <PageLayout title="היסטורית משחקים">
      <div className="history-intro max-w-3xl mx-auto mb-4">
        <p className="text-sm text-muted-foreground">
          רוצים לנסות שוב? פספסתם את הסמנטעל אתמול? כאן תוכלו לשחק בגרסאות קודמות של המשחק היומי.<br />
        בכל יום, קצת אחרי שעולה החידה החדשה בסמנטעל, יעלה המשחק של אתמול ותוכלו למצוא אותו גם כאן וגם בדף הראשי.
        </p>
      </div>
      <HistoryPanel />
    </PageLayout>
  );
};

export default History;
