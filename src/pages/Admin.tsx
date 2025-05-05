
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect non-admin users
    if (!currentUser?.isAdmin) {
      toast({
        variant: "destructive",
        title: "גישה נדחתה",
        description: "אין לך הרשאה לצפות בדף זה",
      });
      navigate("/");
    }
  }, [currentUser, navigate, toast]);

  // Don't render anything if not admin
  if (!currentUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-semantle-dark">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-semantle-accent mb-8">פאנל ניהול</h2>
          <AdminPanel />
        </div>
      </main>
      <footer className="p-4 border-t border-semantle-primary text-center text-sm text-muted-foreground">
        סמנטל עברית יומי &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Admin;
