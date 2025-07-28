
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AdminPanel from "@/components/AdminPanel";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

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
    <div className="min-h-screen flex flex-col bg-background dark:bg-slate-900">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-8 font-heebo">פאנל ניהול</h2>
          <AdminPanel />
        </div>
      </main>
      <footer className="p-4 border-t border-primary-200 dark:border-slate-700 text-center text-sm text-muted-foreground">
        סמנטעל + &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Admin;
