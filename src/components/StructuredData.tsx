import React from 'react';
import { SITE_URL } from '@/lib/seo';

interface GameStructuredDataProps {
  gameName?: string;
  description?: string;
  url?: string;
  datePublished?: string;
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  description: string;
}

export const GameStructuredData: React.FC<GameStructuredDataProps> = ({
  gameName = 'סמנטעל פלוס',
  description = 'משחק ניחוש מילים בעברית מבוסס על דמיון סמנטי. נחשו את המילה היומית או שחקו במילים קודמות.',
  url = `${SITE_URL}/`,
  datePublished
}) => {
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": gameName,
    "description": description,
    "url": url,
    "datePublished": datePublished,
    "genre": "Word Game",
    "gamePlatform": "Web Browser",
    "operatingSystem": "Any",
    "applicationCategory": "GameApplication",
    "inLanguage": "he",
    "audience": {
      "@type": "Audience",
      "audienceType": "Hebrew speakers"
    },
    "creator": {
      "@type": "Person",
      "name": "Sigarya",
      "url": "https://github.com/sigarya"
    },
    "isBasedOn": {
      "@type": "Game",
      "name": "Semantle",
      "creator": {
        "@type": "Person",
        "name": "David Turner"
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
    />
  );
};

export const OrganizationStructuredData: React.FC<OrganizationStructuredDataProps> = ({
  name,
  url,
  description
}) => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "description": description,
    "founder": {
      "@type": "Person",
      "name": "Sigarya",
      "url": "https://github.com/sigarya"
    },
    "sameAs": [
      "https://github.com/Sigarya/semantle-plus"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": "Hebrew"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
};

export const WebsiteStructuredData: React.FC = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "סמנטעל פלוס",
    "url": `${SITE_URL}/`,
    "description": "משחק ניחוש מילים בעברית מבוסס על דמיון סמנטי",
    "inLanguage": "he"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  );
};