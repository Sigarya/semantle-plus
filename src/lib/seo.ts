export const SITE_URL = 'https://semantle.sigarya.xyz';

// Search metadata is independent of the visible page heading.
export const SEO_PAGES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'סמנטעל פלוס – משחק מילים בעברית, עם חברים וללא פרסומות',
    description: 'שחקו סמנטעל פלוס בחינם וללא פרסומות: נחשו את המילה היומית, חזרו לחידות קודמות ושחקו עם חברים בזמן אמת.',
  },
  '/about': {
    title: 'על סמנטעל פלוס – איך משחקים ומה אפשר לעשות באתר',
    description: 'מה זה סמנטעל ואיך משחקים? הסבר על ציוני הקרבה ועל סמנטעל פלוס: ללא פרסומות, כל חידות העבר בלי הגבלה ומשחק עם חברים בחדר בזמן אמת.',
  },
  '/history': {
    title: 'סמנטעל של אתמול וחידות קודמות | סמנטעל פלוס',
    description: 'סיימתם את הסמנטעל היומי? בחרו תאריך ושחקו בחידות סמנטעל קודמות, לבד או עם חברים.',
  },
  '/multiplayer': {
    title: 'סמנטעל עם חברים – משחק משותף בזמן אמת | סמנטעל פלוס',
    description: 'צרו חדר סמנטעל או הצטרפו לחברים עם קוד חדר. נחשו יחד וצפו בניחושים בזמן אמת, בחידה היומית או בחידה מתאריך קודם.',
  },
  '/leaderboard': {
    title: 'טבלת המובילים בסמנטעל | סמנטעל פלוס',
    description: 'צפו בטבלת המובילים של סמנטעל פלוס ובתוצאות השחקנים בחידה היומית.',
  },
  '/contact': {
    title: 'יצירת קשר | סמנטעל פלוס',
    description: 'יש לכם שאלה, הצעה או דיווח על תקלה בסמנטעל פלוס? פנו אלינו דרך טופס יצירת הקשר.',
  },
  '/privacy': {
    title: 'מדיניות פרטיות | סמנטעל פלוס',
    description: 'מידע על שמירת נתונים, שימוש במידע ופרטיות השחקנים בסמנטעל פלוס.',
  },
};

export const normalizeSeoPath = (path: string) => path.replace(/\/+$/, '') || '/';

export const isIndexablePath = (path: string) => Object.prototype.hasOwnProperty.call(SEO_PAGES, normalizeSeoPath(path));
