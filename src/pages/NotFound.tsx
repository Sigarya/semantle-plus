
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-semantle-dark p-4 text-center">
      <h1 className="text-4xl font-bold text-semantle-accent mb-4">404</h1>
      <p className="text-xl text-white mb-8">העמוד שחיפשת לא נמצא</p>
      <Button asChild className="bg-semantle-primary hover:bg-semantle-secondary">
        <Link to="/">חזרה לדף הראשי</Link>
      </Button>
    </div>
  );
};

export default NotFound;
