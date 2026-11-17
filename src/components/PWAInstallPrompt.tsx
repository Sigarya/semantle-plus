import { GOOGLE_PLAY_URL } from "@/lib/appLinks";
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Smartphone, Plus, Share, MoreVertical } from "lucide-react";
import { usePWAInstall } from "@/context/PWAInstallContext";

interface PWAInstallPromptProps {
  onInstallSuccess: () => void;
  onBannerVisibilityChange?: (isVisible: boolean) => void;
}

export const PWAInstallPrompt = ({ onInstallSuccess, onBannerVisibilityChange }: PWAInstallPromptProps) => {
  const { deferredPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installError, setInstallError] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hideBanner = () => onBannerVisibilityChange?.(false);

  const handleInstall = async () => {
    if (!deferredPrompt) { setInstructionsOpen(true); return; }
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { onInstallSuccess(); hideBanner(); }
      else hideBanner();
    } catch {
      setInstallError(true);
      setInstructionsOpen(true);
    } finally { setIsInstalling(false); }
  };

  return (
    <>
      <section className="install-banner" aria-label="התקנת האפליקציה">
        <div className="install-banner-inner">
          <div className="install-copy">
            <Smartphone aria-hidden="true" className="install-symbol" />
            <div><strong>סמנטעל פלוס, ישר ממסך הבית</strong><span>אפשר להוסיף את האתר למסך הבית או להוריד מ־Google Play.</span></div>
          </div>
          <div className="install-actions">
            <Button size="sm" onClick={handleInstall} disabled={isInstalling} className="install-home"><Plus aria-hidden="true" />{isInstalling ? "מתקין..." : "הוספה למסך הבית"}</Button>
            <a className="google-play-link" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" aria-label="הורדת סמנטעל פלוס מ־Google Play">
              <svg viewBox="0 0 24 26" width="18" height="20" aria-hidden="true"><path fill="#32BBFF" d="M1 1 13 13 1 25Z"/><path fill="#32D396" d="m1 1 15 9-3 3Z"/><path fill="#FFBC00" d="m16 10 6 3-6 3-3-3Z"/><path fill="#F24E60" d="m1 25 12-12 3 3Z"/></svg>
              <b dir="ltr">Google Play</b>
            </a>
          </div>
          <Button size="sm" variant="ghost" onClick={hideBanner} className="install-later">מאוחר יותר</Button>

        </div>
      </section>
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>הוספה למסך הבית</DialogTitle><DialogDescription>פותחים את סמנטעל פלוס כמו אפליקציה, ישירות ממסך הבית.</DialogDescription></DialogHeader>
          {installError && <p role="alert" className="form-error text-sm">חלון ההתקנה לא נפתח. אפשר לנסות דרך תפריט הדפדפן.</p>}
          {!window.isSecureContext && <p className="text-sm text-muted-foreground">בכתובת הבדיקה המקומית אין חיבור מאובטח, ולכן התקנת PWA אינה זמינה. כדי להתקין, פתחו את האתר בכתובת המאובטחת שלו.</p>}
          <ol className="install-instructions">
            {isIOS ? <><li><Share size={18} aria-hidden="true" />פתחו את האתר ב־Safari ולחצו על כפתור השיתוף.</li><li><Plus size={18} aria-hidden="true" />בחרו ״הוסף למסך הבית״ ואשרו את ההוספה.</li></> : <><li><MoreVertical size={18} aria-hidden="true" />פתחו את תפריט הדפדפן.</li><li><Plus size={18} aria-hidden="true" />בחרו ״הוספה למסך הבית״ או ״התקנת אפליקציה״, ואשרו. במחשב אפשר להשתמש גם בסמל ההתקנה שבשורת הכתובת.</li></>}
          </ol>
          <p className="text-xs text-muted-foreground">שם האפשרות והזמינות שלה תלויים בדפדפן ובמכשיר. אם האתר כבר מותקן, ייתכן שלא תופיע אפשרות התקנה נוספת.</p>
        </DialogContent>
      </Dialog>
    </>
  );
};
