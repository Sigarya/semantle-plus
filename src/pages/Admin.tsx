
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LazyAdminPanel from "@/components/LazyAdminPanel";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/PageLayout";

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
    <PageLayout title="פאנל ניהול">
      <div className="max-w-3xl mx-auto">
        <LazyAdminPanel />
      </div>
    </PageLayout>
  );
};

export default Admin;
