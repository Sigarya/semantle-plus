
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">אודות סמנטעל +</h2>
          
          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">מה זה סמנטעל?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                סמנטעל הוא משחק ניחושים המבוסס על הקרבה הסמנטית בין מילים. המטרה היא לנחש את המילה היומית
                כאשר לכל ניחוש תקבל ציון המבטא עד כמה המילה שניחשת קרובה למילה המבוקשת מבחינת המשמעות.
              </p>
              <p>
                הציון מחושב באמצעות מודלים של עיבוד שפה טבעית (NLP) אשר מייצגים מילים כווקטורים במרחב סמנטי,
                כך שמילים עם משמעויות קרובות נמצאות קרוב זו לזו במרחב הזה.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">איך משחקים?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>הקלד מילה בעברית בשדה הניחוש ולחץ על כפתור "נחש".</li>
                <li>לאחר כל ניחוש תקבל ציון בין 0% ל-100% המייצג את הקרבה הסמנטית למילה המבוקשת.</li>
                <li>ככל שהניחוש שלך קרוב יותר סמנטית למילה, כך הציון יהיה גבוה יותר.</li>
                <li>מטרת המשחק היא לנחש את המילה המדויקת בכמה שפחות ניחושים.</li>
                <li>צבע הניקוד מרמז על כמה קרוב אתה לפתרון:
                  <ul className="list-disc list-inside pr-5 mt-1">
                    <li className="similarity-cold">כחול - רחוק מאוד</li>
                    <li className="similarity-warm">כתום - מתקרב</li>
                    <li className="similarity-hot">ירוק - קרוב מאוד</li>
                  </ul>
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
                <li>התחל עם מילים כלליות בתחומים שונים כדי לזהות את התחום הסמנטי של המילה המבוקשת.</li>
                <li>שים לב לניחושים שקיבלו ציון גבוה וחפש מילים נרדפות או מילים מאותו תחום.</li>
                <li>לפעמים כדאי לנסות צורות דקדוקיות שונות של אותה מילה (יחיד/רבים, זכר/נקבה).</li>
                <li>אם אתה מחובר למערכת, הסטטיסטיקות שלך יישמרו ותוכל לעקוב אחר ההתקדמות שלך.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl font-heebo">קרדיטים והשראה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                סמנטעל + מבוסס על רעיון המשחק המקורי Semantle שנוצר על ידי David Turner, 
                עם התאמות לעברית והרחבות ייחודיות.
              </p>
              <p>
                המשחק משתמש במודלים של עיבוד שפה טבעית בעברית לחישוב הקרבה הסמנטית בין מילים.
              </p>
              <p>
                תודה מיוחדת לישי שפי על הפיתוח המקורי של סמנטעל בעברית.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
        סמנטעל + &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default About;
