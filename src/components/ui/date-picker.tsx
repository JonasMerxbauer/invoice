import { useState } from "react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Field, FieldLabel } from "~/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

type DatePickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  invalid?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  id,
  className,
  invalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          aria-invalid={invalid}
          className={cn(
            "justify-start font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? format(value, "dd.MM.yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-(--radix-popover-trigger-width) overflow-hidden p-0"
        align="start"
      >
        <Calendar
          className="w-full"
          mode="single"
          selected={value}
          defaultMonth={value}
          captionLayout="dropdown"
          classNames={{ root: "w-full" }}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerSimple() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date">Date of birth</FieldLabel>
      <DatePicker id="date" value={date} onChange={setDate} />
    </Field>
  );
}
