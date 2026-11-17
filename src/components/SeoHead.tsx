
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_URL, SEO_PAGES, normalizeSeoPath, isIndexablePath } from '@/lib/seo';

interface SeoHeadProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
    noindex?: boolean;
}

const SeoHead = ({
    title,
    description,
    image = 'https://ciuhkkmuvqoepohihofs.supabase.co/storage/v1/object/public/icon//semantle-sigarya-xyz-1024x768desktop-3175cf.jpg',
    article = false,
    noindex = false
}: SeoHeadProps) => {
    const location = useLocation();
    const pathname = normalizeSeoPath(location.pathname);
    const page = SEO_PAGES[pathname];
    const pageTitle = title ?? page?.title ?? 'סמנטעל פלוס';
    const pageDescription = description ?? page?.description;
    const excluded = noindex || !isIndexablePath(pathname);
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{pageTitle}</title>
            {pageDescription && <meta name="description" content={pageDescription} />}
            <meta name="robots" content={excluded ? "noindex, follow" : "index, follow"} />
            {!excluded && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:locale" content="he_IL" />
            <meta property="og:site_name" content="סמנטעל פלוס" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={article ? 'article' : 'website'} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SeoHead;
