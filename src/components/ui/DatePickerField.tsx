"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return ad < bd;
}

function isAfterDay(a: Date, b: Date): boolean {
  const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return ad > bd;
}

function buildMonthGrid(month: Date): Array<Date | null> {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface DatePickerFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  minDate?: string | null;
  maxDate?: string | null;
  className?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  className,
}: DatePickerFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const selected = parseIsoDate(value);
  const min = parseIsoDate(minDate ?? null);
  const max = parseIsoDate(maxDate ?? null);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => selected ?? min ?? new Date()
  );

  useEffect(() => {
    if (open) {
      setVisibleMonth(selected ?? min ?? new Date());
    }
  }, [open, selected, min]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = Math.max(rect.width, 288);
      const left = Math.min(rect.left, window.innerWidth - width - 16);
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeight = 320;
      const top =
        spaceBelow >= calendarHeight
          ? rect.bottom + 8
          : Math.max(16, rect.top - calendarHeight - 8);

      setPopoverStyle({ top, left, width });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function isDisabled(date: Date): boolean {
    if (min && isBeforeDay(date, min)) return true;
    if (max && isAfterDay(date, max)) return true;
    return false;
  }

  function handleSelect(date: Date) {
    if (isDisabled(date)) return;
    onChange(toIsoDate(date));
    setOpen(false);
  }

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-surface px-4 py-2.5 text-left text-sm transition-colors",
          "hover:border-accent/30 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30",
          value ? "text-gray-200" : "text-gray-500"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
        <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
      </button>

      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
        >
          <X className="h-3 w-3" />
          Clear date
        </button>
      ) : null}

      {open && popoverStyle ? (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          style={{
            position: "fixed",
            top: popoverStyle.top,
            left: popoverStyle.left,
            width: popoverStyle.width,
          }}
          className="z-[80] rounded-xl border border-white/[0.08] bg-surface-raised p-3 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-gray-200">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildMonthGrid(visibleMonth).map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-9" />;
              }

              const selectedDay = selected ? isSameDay(date, selected) : false;
              const today = isSameDay(date, new Date());
              const disabled = isDisabled(date);

              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                    disabled && "cursor-not-allowed text-gray-600",
                    !disabled && !selectedDay && "text-gray-200 hover:bg-white/[0.06]",
                    selectedDay && "bg-accent font-medium text-white",
                    today && !selectedDay && !disabled && "ring-1 ring-accent/40"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
