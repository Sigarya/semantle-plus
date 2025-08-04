import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">
            סמנטעל פלוס – משחק מילים יומי בעברית עם כל המילים הקודמות
          </h2>

          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">מה זה סמנטעל?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                סמנטעל הוא משחק ניחוש מילים יומי המבוסס על קרבה סמנטית בין מילים. זה משחק יומי בעברית, בדומה ל־Wordle אבל במקום אותיות בודקים משמעות. המטרה היא לנחש את המילה סודית באמצעות רמזים שמבוססים על קרבה במשמעות למילה שניחשת.
              </p>
              <p>
                סמנטעל פלוס הוא הרחבה של המשחק המקורי, ומאפשר לשחק לא רק במילה היומית, אלא גם במילים מהעבר. זהו משחק ניחוש מילים ייחודי שמשתמש בטכנולוגיות של עיבוד שפה טבעית (NLP) בעברית, אשר ממפה מילים למרחב סמנטי וחושף את הקשרים ביניהן.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">איך משחקים?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>הקלידו מילה בעברית בשדה הניחוש ולחצו על כפתור "נחש".</li>
                <li>לאחר כל ניחוש תקבלו ציון בין 0% ל-100% המייצג את הקרבה הסמנטית למילה המבוקשת.</li>
                <li>ככל שהניחוש קרוב יותר סמנטית למילה, כך הציון יהיה גבוה יותר.</li>
                <li>מטרת המשחק היא לנחש את המילה המדויקת בכמה שפחות ניחושים.</li>
                <li>
                  אחרי שמגיעים ל-1,000 המילים הכי קרובות, יופיע מד שמראה את מיקום המילה שלך מתוך ה-1,000.
                  למשל, 1/1000 תהיה המילה הכי רחוקה ו-999/1000 תהיה המילה הכי קרובה למילה הסודית.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">טיפים והמלצות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li>תתחילו עם מילים כלליות בתחומים שונים כדי לזהות את התחום הסמנטי של המילה המבוקשת.</li>
                <li>שימו לב לניחושים שקיבלו ציון גבוה וחפש מילים נרדפות או מילים מאותו תחום.</li>
                <li>נסו גם צורות דקדוק שונות - יחיד/רבים, זכר/נקבה – לפעמים זה עושה את ההבדל.</li>
                <li>אם תתחברו למערכת, הסטטיסטיקות יישמרו ותוכלו לעקוב אחרי הביצועים שלכם.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">קרדיטים והשראה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                סמנטעל פלוס מבוסס על הרעיון המקורי של <a href="https://semantle.novalis.org/" target="_blank" rel="noopener noreferrer">Semantle</a> מאת David Turner, וכמובן על משחק <a href="https://Semantle.ishefi.com" target="_blank" rel="noopener noreferrer">הסמנטעל</a> המקורי בעברית עם התאמות למי שרוצים לחקור ולשחק ביותר ממילה אחת ביום.
              </p>
              <p>
                המשחק עושה שימוש במודל של עיבוד שפה טבעית בעברית שפותח על ידי <a href="https://github.com/iddoyadlin" target="_blank" rel="noopener noreferrer">Iddoyadlin</a>, וכמובן על המשחק והמילים היומיות של המשחק המקורי שפיתח ומתפעל <a href="https://Semantle.ishefi.com" target="_blank" rel="noopener noreferrer">ishefi</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
<footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
  <div className="space-y-1 leading-relaxed rtl text-sm">
    <a href="https://github.com/sigarya" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      Made by Sigarya
    </a>
    <br />
    פרויקט עצמאי בהשראת&nbsp;
    <a href="https://semantle.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      Semantle
    </a>{" "}
    (David Turner).
    <br />
    מבוסס על הגרסה העברית והמילים היומיות של&nbsp;
    <a href="https://semantle.ishefi.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      סמנטעל (ishefi)
    </a>
    , והמודל של&nbsp;
    <a href="https://x.com/IddoYadlin" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      Iddo Yadlin
    </a>.
    <br />
    <a href="https://github.com/Sigarya/semantle-plus" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      קוד מקור
    </a>
  </div>
</footer>

    </div>
  );
};

export default About;
