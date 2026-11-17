
import { ReactNode } from "react";
import Header from "@/components/Header";
import { GameStructuredData, OrganizationStructuredData } from "@/components/StructuredData";
import SeoHead from "./SeoHead";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const PageLayout = ({ children, title, description }: PageLayoutProps) => {

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <GameStructuredData />
      <OrganizationStructuredData
        name="סמנטעל פלוס"
        url="https://semantle.sigarya.xyz"
        description="משחק ניחוש מילים בעברית מבוסס על דמיון סמנטי"
      />
      <SeoHead title={title} description={description} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">דלג לתוכן המשחק</a>
      <Header />
      <main id="main-content" className="page-main flex-grow px-4 py-6 md:px-8 md:py-8">
        <div className="page-content mx-auto">
          {title && <h2 className="text-2xl font-bold text-right text-primary mb-6 font-heebo">{title}</h2>}
          {children}
        </div>
      </main>
      <footer className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        <div className="space-y-1 leading-relaxed rtl text-sm">
          <a href="https://github.com/sigarya" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Made by Sigarya
          </a>
          <br />
          <p dir="rtl" lang="he">
            אוהבים את סמנטעל פלוס?&nbsp;
            <a href="https://ko-fi.com/sigarya" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              אתם יכולים לקנות לי ☕
            </a>
          </p>
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
          <br />
          <a href="/privacy" className="underline hover:text-primary">
            מדיניות פרטיות
          </a>
          <span>•</span>
          <a href="/contact" className="underline hover:text-primary">
            צור קשר
          </a>
        </div>
      </footer>

    </div>
  );
};

export default PageLayout;
