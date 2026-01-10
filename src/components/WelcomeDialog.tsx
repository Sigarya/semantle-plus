import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WelcomeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Delay opening to prevent pre-renderer from capturing the open modal state (which locks accessibility)
    const timer = setTimeout(() => {
      const hasVisited = localStorage.getItem('semantle-has-visited');
      if (!hasVisited) {
        setIsOpen(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('semantle-has-visited', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center font-heebo">
            נחשו את המילה הסודית
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            אפשר לנחש כל מילה. המילה הסודית תהיה תמיד מילה אחת בלבד.
            אחרי כל ניחוש, המשחק יראה לכם עד כמה המילה קרובה במשמעות למילה הסודית.
            הקרבה היא לא באיות אלא במשמעות - מה שנקרא קרבה סמנטית.
          </p>

          <p>
            המדד הזה מבוסס על מודל בשם Word2Vec, שלמד את השפה מטקסטים של ויקיפדיה.
            במילים פשוטות: שתי מילים נחשבות קרובות יותר ככל שיותר סביר שתופענה יחד בהקשרים דומים.
          </p>

          <p>
            המשחק נותן ציון בין -100 ל־100: 100- זה מאוד רחוק, 100 זו המילה הסודית עצמה.
          </p>

          <p>
            בנוסף, תראו אם הניחוש שלכם נמצא בין אלף המילים הקרובות ביותר למילה הסודית - ככה תדעו אם אתם בכיוון.
          </p>

          <p>
            המילה הסודית יכולה להיות מכל חלק דיבר (שם עצם, פועל, תואר וכו'), אבל תמיד תהיה מילה אחת בלבד.
          </p>

          <p>
            בניגוד ל־Wordle, כאן לא מגבילים אתכם לשישה ניחושים - לרוב תצטרכו הרבה ניחושים כדי להגיע למטרה.
            המשחק מתעדכן בכל יום עם המילה שהייתה אתמול במשחק המקורי.
          </p>

          <div className="border-t pt-4 mt-6">
            <h3 className="font-bold mb-2 font-heebo">מה שונה ב־סמנטעל +</h3>
            <p>
              בדף הראשי תוכלו לשחק בכל יום במילה שהופיעה אתמול במשחק המקורי.
            </p>
            <p className="mt-2">
              דרך דף "היסטוריה" אפשר לגשת לכל אחת מהמילים מהעבר ולשחק אותן מתי שתרצו - בלי לחץ של זמן.
            </p>
          </div>

          <p className="font-bold text-center font-heebo">בהצלחה!</p>
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={handleClose} className="px-8">
            בואו נתחיל!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;