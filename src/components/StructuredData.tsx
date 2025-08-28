import React from 'react';

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
  url = 'https://semantleplus.com',
  datePublished = '2024-01-01'
}) => {
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "Game",
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
    "foundingDate": "2024",
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
    "url": "https://semantleplus.com",
    "description": "משחק ניחוש מילים בעברית מבוסס על דמיון סמנטי",
    "inLanguage": "he",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://semantleplus.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  );
};