
import { ReactNode } from "react";
import Header from "@/components/Header";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
}

const PageLayout = ({ children, title }: PageLayoutProps) => {
  
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {title && <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">{title}</h2>}
          {children}
        </div>
      </main><footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
  <div className="space-y-1 leading-relaxed rtl text-sm">
    <a href="https://github.com/sigarya" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      Made by Sigarya
    </a>
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
