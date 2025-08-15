import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/PageLayout";

const Privacy = () => {
  return (
    <PageLayout title="תנאי פרטיות">
      <div className="space-y-6">
        
        {/* Hebrew Title */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo text-center">תנאי פרטיות</CardTitle>
          </CardHeader>
        </Card>

        {/* Last Updated */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-heebo">עדכון אחרון</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">15 באוגוסט 2025</p>
          </CardContent>
        </Card>

        {/* Introduction */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">מבוא</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              הפרטיות שלך חשובה לנו. כדי להגן טוב יותר על המידע הרגיש שלך, אנו מספקים הודעה זו המסבירה את הפרקטיקות המקוונות שלנו למידע וכיצד הן מתייחסות ספציפית לסוג או כמות הנתונים שעלולים להיאסף ממך באמצעות השימוש באתר בכל זמן נתון במהלך גלישה במחשבים שולחניים, טאבלטים או מכשירים ניידים.
            </p>
          </CardContent>
        </Card>

        {/* Our Commitment */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">המחויבות שלנו</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              אנו לא אוספים שום מידע אישי באתר זה, מלבד מה שמפורט להלן.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">המידע שאנו אוספים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              אנו אוספים את כתובות ה-IP של המשתמשים שלנו כאשר אנו שואפים למנוע מתקפות סייבר, כגון מתקפות מניעת שירות. אנו גם אוספים כתובות דוא"ל, שמות ותמונות פרופיל ממשתמשים שבוחרים להתחבר לאתר שלנו עם חשבון Google שלהם. אנו גם אוספים קלטים טקסטואליים מסוימים שמוצעים על ידי משתמשים באתר. נתונים אלה לעולם לא נמכרים או משותפים עם אף אחד אחר. הגישה שלנו לשימוש במידע שהתקבל מחשבונות Google תציית למדיניות השירותים של Google API לנתוני משתמש, כולל דרישות השימוש המוגבל. מידע אישי שאנו אוספים עשוי להיות מועבר, מאוחסן ומעובד בארצות הברית או בכל מדינה אחרת שבה אנו מחזיקים מתקנים.
            </p>
          </CardContent>
        </Card>

        {/* Third Party Services */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">שירותי צד שלישי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              אנו אוספים אנליטיקה גנרית של אתרים באמצעות דפדפן אתרים ועוגיות. נתוני האנליטיקה שאנו אוספים הם אנונימיים. אנו גם משתמשים בשירותי צד שלישי שאוספים לחיצות, קלטים וצפיות בדפים כדי לזהות חיכוך בזרימת משתמשים באתר. אתה מכיר בכך שאנו לא אחראים לאופן שבו צדדים שלישיים אוספים או משתמשים במידע שלך.
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">עוגיות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              עוגיות הן קבצים עם כמות קטנה של נתונים המשמשים בדרך כלל כמזהים ייחודיים אנונימיים. אלה נשלחים לדפדפן שלך מהאתרים שאתה מבקר בהם ונשמרים בזיכרון הפנימי של המכשיר שלך. אתר זה משתמש ב"עוגיות" אלה כדי לזהות משתמשים שהתחברו לאתר שלנו. בנוסף, האתר עשוי להשתמש בקוד וספריות של צד שלישי המשתמשים ב"עוגיות" כדי לאסוף מידע ולשפר את השירותים שלהם. יש לך אפשרות לקבל או לסרב לעוגיות אלה ולדעת מתי עוגיה נשלחת למכשיר שלך. אם תבחר לסרב לעוגיות שלנו, ייתכן שלא תוכל להשתמש בחלקים מסוימים של האתר הזה.
            </p>
          </CardContent>
        </Card>

        {/* Changes to the Policy */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">שינויים במדיניות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              אנו עשויים לשנות מדיניות זו כדי לשקף שינויים בחוק, בפרקטיקות איסוף המידע שלנו, שינויים באתר, או כל סיבה אחרת. אנו נודיע לך על שינויים אלה על ידי עדכון התאריך בראש העמוד הזה, או, במקרים מסוימים ושיקול דעתנו, על ידי הוספת הצהרה לדף הבית של האתר שלנו. שינויים נכנסים לתוקף עם פרסום. השימוש המתמשך שלך באתר לאחר שאנו מפרסמים מדיניות מתוקנת פירושו שאתה מקבל את המדיניות המתוקנת.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-background dark:bg-slate-800 border-primary-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-heebo">צור קשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right leading-relaxed">
              אם יש לך שאלות או חששות לגבי מדיניות הפרטיות שלנו, אנא צור קשר:
            </p>
            <ul className="list-disc list-inside space-y-2 text-right">
              <li>דוא"ל: semantleplus@gmail.com</li>
              <li>GitHub: <a href="https://github.com/Sigarya/semantle-plus" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">https://github.com/Sigarya/semantle-plus</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Privacy;
