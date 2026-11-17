import { useMemo, useState, useId } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { he } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value: string;
  dates: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  label?: string;
  displayFormat?: string;
}

export default function GameDatePicker({ value, dates, disabled, onChange, label = "משחק מיום", displayFormat = "d בMMMM yyyy" }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const available = useMemo(() => new Set(dates), [dates]);
  const sorted = useMemo(() => [...dates].sort(), [dates]);
  const selected = value ? parseISO(value) : undefined;
  return <div className="room-date-picker">
    <span id={`${id}-label`}>{label}</span>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={`${id}-trigger`} variant="outline" disabled={disabled} className="date-trigger" aria-labelledby={`${id}-label ${id}-value`}>
          <CalendarDays aria-hidden="true" />
          <span id={`${id}-value`}>{selected ? format(selected, displayFormat, { locale: he }) : "בחירת תאריך"}</span>
          <ChevronDown aria-hidden="true" className="date-chevron" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="room-calendar" dir="rtl" aria-label={label} collisionPadding={12}>
        <Calendar mode="single" dir="rtl" locale={he} selected={selected} defaultMonth={selected ?? (sorted.length ? parseISO(sorted[sorted.length - 1]) : undefined)}
          fromDate={sorted[0] ? parseISO(sorted[0]) : selected}
          toDate={sorted.length ? parseISO(sorted[sorted.length - 1]) : selected}
          captionLayout="dropdown-buttons" initialFocus
          classNames={{ caption_label: "sr-only", caption: "calendar-caption", nav_button_previous: "absolute right-0", nav_button_next: "absolute left-0", caption_dropdowns: "calendar-month-selectors", dropdown_month: "calendar-month", dropdown_year: "calendar-year", dropdown: "calendar-select" }}
          disabled={date => !available.has(format(date, "yyyy-MM-dd"))}
          labels={{ labelPrevious: () => "החודש הקודם", labelNext: () => "החודש הבא", labelMonthDropdown: () => "חודש", labelYearDropdown: () => "שנה", labelDay: date => format(date, "EEEE, d בMMMM yyyy", { locale: he }) }}
          onSelect={date => { if (date) { onChange(format(date, "yyyy-MM-dd")); setOpen(false); } }}
        />
      </PopoverContent>
    </Popover>
  </div>;
}
