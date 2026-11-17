import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild><Button variant="ghost" className="game-help">איך משחקים?</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center font-heebo">
            נחשו את המילה הסודית
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            בכל יום מחכה לכם מילה סודית אחת. הקלידו מילה ולחצו על ״נחש״: אחרי כל ניסיון תקבלו ציון שמראה עד כמה הניחוש קרוב למילה הסודית במשמעות. אין הגבלה על מספר הניחושים.
          </p>
          <p>
            הקרבה אינה נקבעת לפי האותיות או אורך המילה. למשל, מילים שקשורות לאותו נושא עשויות להיות קרובות גם אם הן נראות שונות. החישוב מבוסס על מודל Word2Vec, שלמד קשרים בין מילים מטקסטים של ויקיפדיה.
          </p>
          <p>
            ציון הקרבה נע בין <bdi>−100</bdi> ל־<bdi>100</bdi>. ככל שהציון גבוה יותר, הניחוש קרוב יותר לפי המודל; <bdi>100</bdi> היא המילה הסודית. נסו להשתמש בניחושים הקרובים כדי לחשוב על מילים נוספות מאותו תחום.
          </p>
          <p>
            כשניחוש נמצא בין אלף המילים הקרובות ביותר, תראו גם דירוג מתוך 1,000: <bdi>1/1000</bdi> נמצא בקצה הרחוק של הרשימה, ו־<bdi>999/1000</bdi> הוא הקרוב ביותר לפני המילה הסודית.
          </p>
          <div className="border-t pt-4 mt-6 space-y-3">
            <h3 className="font-bold font-heebo">מה אפשר לעשות בסמנטעל פלוס?</h3>
            <p>לשחק בלי פרסומות בחידה היומית, שמתבססת על המילה שהופיעה אתמול בסמנטעל המקורי.</p>
            <p>לפתוח את ״חידות קודמות״ ולשחק בכל חידות העבר, בלי הגבלה.</p>
            <p>לבחור ״משחק עם חברים״, ליצור חדר ולשתף את הקוד. כולם מנחשים את אותה מילה ורואים את הניחושים בזמן אמת — בחידה היומית או בחידה מיום אחר.</p>
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