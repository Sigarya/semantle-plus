import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your routes - these should match your React Router routes
const routes = [
  '/',
  '/about',
  '/history', 
  '/admin',
  '/profile',
  '/leaderboard'
];

const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

// Read the main index.html file
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

console.log('🚀 Starting pre-rendering process...');

routes.forEach(route => {
  // Skip root route as it already exists
  if (route === '/') return;
  
  // Create directory structure for the route
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  
  // Create index.html for this route
  const routeIndexPath = path.join(routeDir, 'index.html');
  
  // Customize the HTML for each route with proper meta tags
  let customizedHtml = indexHtml;
  
  // Add route-specific meta tags for better SEO
  const routeMetaTags = getMetaTagsForRoute(route);
  customizedHtml = customizedHtml.replace(
    /<title>.*?<\/title>/i,
    `<title>${routeMetaTags.title}</title>`
  );
  
  // Add meta description if it doesn't exist
  if (!customizedHtml.includes('<meta name="description"')) {
    customizedHtml = customizedHtml.replace(
      '<title>',
      `<meta name="description" content="${routeMetaTags.description}">\n    <title>`
    );
  }
  
  // Add canonical URL
  customizedHtml = customizedHtml.replace(
    '</head>',
    `    <link rel="canonical" href="https://semantle.sigarya.xyz${route}">\n  </head>`
  );
  
  fs.writeFileSync(routeIndexPath, customizedHtml);
  console.log(`✅ Generated: ${route}/index.html`);
});

// Also update the main index.html with proper meta tags
const homeMetaTags = getMetaTagsForRoute('/');
let homeHtml = indexHtml;
homeHtml = homeHtml.replace(
  /<title>.*?<\/title>/i,
  `<title>${homeMetaTags.title}</title>`
);

if (!homeHtml.includes('<meta name="description"')) {
  homeHtml = homeHtml.replace(
    '<title>',
    `<meta name="description" content="${homeMetaTags.description}">\n    <title>`
  );
}

homeHtml = homeHtml.replace(
  '</head>',
  `    <link rel="canonical" href="https://semantle.sigarya.xyz/">\n  </head>`
);

fs.writeFileSync(indexHtmlPath, homeHtml);

console.log('🎉 Pre-rendering completed successfully!');
console.log(`📁 Generated static HTML files for ${routes.length} routes`);

function getMetaTagsForRoute(route) {
  const metaTags = {
    '/': {
      title: 'סמנטעל פלוס',
      description: 'פתרתם את הסמנטעל ובא לכם לשחק שוב? שחקו בכל המשחקים מכל הימים עכשיו!'
    },
    '/about': {
      title: 'אודות סמנטעל פלוס',
      description: 'מה זה סמנטעל, איך לשחק, מה זה דמיון סמנטי, והיסטוריה של המשחק.'
    },
    '/history': {
      title: 'היסטוריית משחקים',
      description: 'כאן תוכל לשחק בכל המשחקים מכל הימים. המשחק של אתמול יתעדכן כאן בכל יום'
    },
    '/admin': {
      title: 'פאנל ניהול',
      description: 'פאנל ניהול למנהלי סמנטעל פלוס.'
    },
    '/profile': {
      title: 'הפרופיל שלי',
      description: 'נהל את הפרופיל, ההגדרות והנתונים האישיים שלך בסמנטעל פלוס.'
    },
    '/leaderboard': {
      title: 'המובילים',
      description: 'מי פתר היום את החידה הכי מהר?'
    }
  };
  
  return metaTags[route] || metaTags['/'];
}
