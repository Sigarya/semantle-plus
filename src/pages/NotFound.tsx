
import SeoHead from "@/components/SeoHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <SeoHead title="עמוד לא נמצא | סמנטעל פלוס" noindex />
      <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-foreground mb-8">העמוד שחיפשת לא נמצא</p>
      <Button asChild className="bg-primary text-primary-foreground">
        <Link to="/">חזרה לדף הראשי</Link>
      </Button>
    </div>
  );
};

export default NotFound;
