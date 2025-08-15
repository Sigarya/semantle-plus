import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import PageLayout from "@/components/PageLayout";
import { Mail, Send, User, MessageSquare } from "lucide-react";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא מלאו את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://formsubmit.co/semantleplus@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: "הודעה חדשה מאתר סמנטעל פלוס",
          _captcha: "false",
          _template: "table"
        }),
      });

      if (response.ok) {
        toast({
          title: "ההודעה נשלחה בהצלחה!",
          description: "תודה שפנית אלינו. נחזור אליך בהקדם האפשרי.",
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          message: ""
        });
      } else {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "אנא נסה שנית מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="צור קשר">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Mail className="h-16 w-16 mx-auto text-primary mb-4" />
          <p className="text-lg text-muted-foreground">
            יש לך שאלה, הצעה או רוצה לשתף אותנו במשוב? נשמח לשמוע ממך!
          </p>
        </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">שלחו לנו הודעה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  שם מלא
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="שם מלא"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12 text-base"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  כתובת אימייל
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 text-base"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  הודעה
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="ההודעה שלך..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="min-h-32 text-base resize-none"
                  dir="rtl"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    שלח הודעה
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Contact;
