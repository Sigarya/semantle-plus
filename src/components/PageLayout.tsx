
import { ReactNode } from "react";
import Header from "@/components/Header";
import { GameStructuredData, OrganizationStructuredData, WebsiteStructuredData } from "@/components/StructuredData";
import SeoHead from "./SeoHead";
import { Link, useLocation } from "react-router-dom";
import { normalizeSeoPath } from "@/lib/seo";
import { GOOGLE_PLAY_URL } from "@/lib/appLinks";
import { useAppDisplay } from "@/hooks/useAppDisplay";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const PageLayout = ({ children, title, description }: PageLayoutProps) => {

  const isHome = normalizeSeoPath(useLocation().pathname) === "/";
  const inApp = useAppDisplay();

  return (
    <div className="app-shell min-h-screen flex flex-col">
      {isHome && <><GameStructuredData /><WebsiteStructuredData /></>}
      <OrganizationStructuredData
        name="סמנטעל פלוס"
        url="https://semantle.sigarya.xyz"
        description="משחק ניחוש מילים בעברית מבוסס על דמיון סמנטי"
      />
      <SeoHead description={description} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">דלג לתוכן המשחק</a>
      <Header />
      <main id="main-content" className="page-main flex-grow px-4 py-6 md:px-8 md:py-8">
        <div className="page-content mx-auto">
          {title && <h2 className="text-2xl font-bold text-right text-primary mb-6 font-heebo">{title}</h2>}
          {children}
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <a href="https://github.com/sigarya" target="_blank" rel="noopener noreferrer" dir="ltr">Made by Sigarya</a>
          <a href="https://ko-fi.com/sigarya" target="_blank" rel="noopener noreferrer">אוהבים לשחק? אפשר לקנות לי ☕</a>
        </div>
        <p className="footer-credits">
          פרויקט עצמאי בהשראת <a href="https://semantle.com" target="_blank" rel="noopener noreferrer">Semantle</a> של David Turner.
          מבוסס על הגרסה העברית והמילים היומיות של <a href="https://semantle.ishefi.com" target="_blank" rel="noopener noreferrer">סמנטעל (ishefi)</a>{" "}
          ועל המודל של <a href="https://x.com/IddoYadlin" target="_blank" rel="noopener noreferrer"><bdi>Iddo Yadlin</bdi></a>.
        </p>
        <nav className="footer-links" aria-label="קישורים נוספים">
          <Link to="/privacy">מדיניות פרטיות</Link>
          <Link to="/contact">צור קשר</Link>
          {!inApp && <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">הורדה מ-Google Play</a>}
          <a href="https://github.com/Sigarya/semantle-plus" target="_blank" rel="noopener noreferrer">קוד מקור</a>
        </nav>
      </footer>

    </div>
  );
};

export default PageLayout;
