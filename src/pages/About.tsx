import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/PageLayout";

const About = () => {
  return (
    <PageLayout title="על סמנטעל פלוס">
      <div className="reading-page space-y-6">
        <Card className="bg-background bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">מה זה סמנטעל?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              סמנטעל הוא משחק ניחוש מילים בעברית. בכל יום יש מילה סודית חדשה, ואחרי כל ניחוש מקבלים ציון שמראה עד כמה המילה שניחשתם קרובה אליה במשמעות.
            </p>
            <p>
              הקרבה אינה קשורה לאותיות או לאורך המילה. היא מחושבת בעזרת מודל שפה שלמד אילו מילים מופיעות בהקשרים דומים בטקסטים. לכן גם מילים שאינן נרדפות יכולות להיות קרובות במשחק: למשל, ״רופא״ ו״בית חולים״ קשורים זה לזה, אף שאין להם אותה משמעות.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">מה יש בסמנטעל פלוס?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              סמנטעל פלוס הוא פרויקט עצמאי שמבוסס על המשחק המקורי בעברית ועל המילים היומיות שלו. אפשר לשחק כאן בחידה היומית, ולצדה יש עוד שתי דרכים לשחק. האתר חינמי ואין בו פרסומות.
            </p>
            <p>
              <strong>כל החידות הקודמות, בלי הגבלה.</strong>{" "}
              סיימתם את החידה של היום או פספסתם כמה ימים? ב־<Link to="/history">חידות קודמות</Link> אפשר לבחור תאריך ולשחק בסמנטעל של אתמול או בכל חידה אחרת מהארכיון. אין מגבלה על מספר החידות שאפשר לשחק.
            </p>
            <p>
              <strong>משחק עם חברים בחדר בזמן אמת.</strong>{" "}
              בעמוד <Link to="/multiplayer">משחק עם חברים</Link> אפשר ליצור חדר ולשלוח לחברים את קוד החדר, או להצטרף לחדר קיים. כולם מנחשים את אותה מילה ורואים את הניחושים ואת ציוני הקרבה של המשתתפים בזמן אמת. אפשר לבחור בחידה היומית או בחידה מיום אחר.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">איך משחקים, ומה אומרים הציונים?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              מקלידים מילה בעברית ולוחצים על ״נחש״. הציון שמתקבל הוא ציון הקרבה למילה הסודית, ולא הסיכוי שהניחוש נכון. ציון גבוה יותר מצביע על קרבה גדולה יותר לפי המודל. ממשיכים לנסות מילים עד שמוצאים את המילה המדויקת, בלי הגבלה על מספר הניחושים.
            </p>
            <p>
              אם הניחוש נמצא בין אלף המילים הקרובות למילה הסודית, מופיע גם דירוג: <bdi>1/1000</bdi> הוא קצה הרשימה הרחוק יותר, ו־<bdi>999/1000</bdi> הוא הניחוש הקרוב ביותר לפני המילה הסודית עצמה. כך אפשר לראות התקדמות גם כשההבדל בציון הקרבה קטן.
            </p>
            <p>
              מעל שדה הניחוש מוצגים ציוני קרבה של שלוש מילים מתוך האלף הקרובות: הקרובה ביותר, העשירית והאלף. הם נותנים קנה מידה לחידה הנוכחית, כי טווח הציונים משתנה ממילה למילה.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">איך מתקדמים כשנתקעים?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2">
              <li>בהתחלה כדאי לנסות מילים מתחומים שונים, כדי למצוא כיוון.</li>
              <li>כשמילה מקבלת ציון גבוה, נסו מילים שקשורות אליה: חפצים, פעולות, מקומות או בעלי מקצוע מאותו תחום, ולא רק מילים נרדפות.</li>
              <li>אפשר לנסות גם צורות שונות של המילה, כמו יחיד ורבים. המודל לא בהכרח נותן להן אותו ציון.</li>
            </ul>
            <p>
              לפעמים צריך לחזור אחורה ולנסות כיוון אחר. ציון גבוה הוא רמז מועיל, אבל הוא לא תמיד מוביל לפתרון בדרך שציפיתם.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">קרדיטים והמקור של המשחק</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              המשחק המקורי <a href="https://semantle.com/" target="_blank" rel="noopener noreferrer">Semantle</a> נוצר באנגלית על ידי David Turner. את <a href="https://semantle.ishefi.com/" target="_blank" rel="noopener noreferrer">סמנטעל בעברית</a> פיתח ומתפעל ishefi. סמנטעל פלוס משתמש במילים היומיות של הגרסה העברית ובמודל השפה של <a href="https://github.com/iddoyadlin" target="_blank" rel="noopener noreferrer">Iddo Yadlin</a>.
            </p>
            <p>
              סמנטעל פלוס פותח על ידי <a href="https://github.com/sigarya" target="_blank" rel="noopener noreferrer">Sigarya</a>. קוד המקור זמין ב־<a href="https://github.com/Sigarya/semantle-plus" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default About;
