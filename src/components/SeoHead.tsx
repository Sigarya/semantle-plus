
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SeoHeadProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
}

const SeoHead = ({
    title = 'סמנטעל פלוס | כל החידות, גם עם חברים',
    description = 'סמנטעל פלוס הוא הגרסה המשודרגת של משחק הניחושים הסמנטי סמנטעל. שחקו בכל חידות העבר, אתגרו חברים וצפו בניחושים שלהם בזמן אמת.',
    image = 'https://ciuhkkmuvqoepohihofs.supabase.co/storage/v1/object/public/icon//semantle-sigarya-xyz-1024x768desktop-3175cf.jpg',
    article = false
}: SeoHeadProps) => {
    const location = useLocation();
    const baseUrl = 'https://semantle.sigarya.xyz';

    // Construct the canonical URL
    // Remove trailing slashes and ensure consistency
    const pathname = location.pathname.endsWith('/') && location.pathname.length > 1
        ? location.pathname.slice(0, -1)
        : location.pathname;

    // Handle home page specifically to ensure it's just the domain
    const canonicalUrl = pathname === '/' ? baseUrl : `${baseUrl}${pathname}`;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={article ? 'article' : 'website'} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SeoHead;
