import { SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/Feedback";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ paddingTop: "var(--space-16)" }}>
      <ErrorState
        icon={<SearchX size={30} aria-hidden />}
        title="صفحه پیدا نشد"
        description="آدرسی که دنبالش هستید وجود ندارد یا جابه‌جا شده است."
        action={<Button onClick={() => navigate("/")}>بازگشت به خانه</Button>}
      />
    </div>
  );
}
