
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect unauthenticated users
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Don't render anything if not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-semantle-dark">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-semantle-accent mb-8">הפרופיל שלי</h2>
          
          <Card className="bg-semantle-dark border-semantle-primary mb-6">
            <CardHeader>
              <CardTitle className="text-xl">פרטי משתמש</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-lg">
                <span className="text-muted-foreground">שם משתמש:</span>
                <span>{currentUser.username}</span>
                
                <span className="text-muted-foreground">סוג חשבון:</span>
                <span>{currentUser.isAdmin ? "מנהל" : "שחקן"}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-semantle-dark border-semantle-primary">
            <CardHeader>
              <CardTitle className="text-xl">סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentUser.stats.gamesWon}</div>
                  <div className="text-sm text-muted-foreground">משחקים שנוצחו</div>
                </div>
                
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentUser.stats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">סה"כ משחקים</div>
                </div>
                
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">
                    {currentUser.stats.totalGames > 0 
                      ? Math.round((currentUser.stats.gamesWon / currentUser.stats.totalGames) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">אחוז ניצחונות</div>
                </div>
                
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentUser.stats.bestGuessCount || "-"}</div>
                  <div className="text-sm text-muted-foreground">ניחושים מינימלי</div>
                </div>
                
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentUser.stats.averageGuessCount.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">ממוצע ניחושים</div>
                </div>
                
                <div className="bg-semantle-primary bg-opacity-20 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{currentUser.stats.winStreak}</div>
                  <div className="text-sm text-muted-foreground">רצף ניצחונות</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="p-4 border-t border-semantle-primary text-center text-sm text-muted-foreground">
        סמנטל עברית יומי &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Profile;
