"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createCreatorBlock,
  createScheduleEvent,
  deleteScheduleEvent,
  updateCreatorBlock,
  updateScheduleEvent,
  type ScheduleParticipantOption,
} from "@/app/schedule/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  addHoursToDateTimeLocal,
  filterEventsForDay,
  formatActionError,
  formatSchedulePreview,
  getWeekDays,
  isSameDay,
  resolveScheduleTimes,
  toDateInputValue,
  toDateTimeLocalValue,
} from "@/lib/schedule/helpers";
import {
  scheduleEventTypeLabels,
  scheduleEventTypes,
  type ScheduleEvent,
  type ScheduleEventType,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface SchedulePageClientProps {
  initialEvents: ScheduleEvent[];
  rangeStartIso: string;
  rangeEndIso: string;
  isStaff: boolean;
  isCreatorPortal: boolean;
  participantOptions?: ScheduleParticipantOption[];
}

interface EventFormState {
  title: string;
  description: string;
  eventType: ScheduleEventType;
  startsAtLocal: string;
  endsAtLocal: string;
  allDay: boolean;
  allDayDate: string;
  location: string;
  selectedUserIds: string[];
  selectedCreatorIds: string[];
}

const BLOCK_DURATION_PRESETS = [
  { label: "1 hour", hours: 1 },
  { label: "2 hours", hours: 2 },
  { label: "4 hours", hours: 4 },
  { label: "Full day", allDay: true as const },
];

function defaultStartForDay(day: Date): Date {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  return start;
}

function defaultEndForDay(day: Date): Date {
  const end = new Date(day);
  end.setHours(10, 0, 0, 0);
  return end;
}

function defaultFormState(day: Date): EventFormState {
  const start = defaultStartForDay(day);
  const end = defaultEndForDay(day);
  return {
    title: "",
    description: "",
    eventType: "meeting",
    startsAtLocal: toDateTimeLocalValue(start),
    endsAtLocal: toDateTimeLocalValue(end),
    allDay: false,
    allDayDate: toDateInputValue(day),
    location: "",
    selectedUserIds: [],
    selectedCreatorIds: [],
  };
}

function blockFormState(day: Date): EventFormState {
  const start = defaultStartForDay(day);
  const end = new Date(start);
  end.setHours(17, 0, 0, 0);
  return {
    ...defaultFormState(day),
    title: "Blocked",
    eventType: "block",
    startsAtLocal: toDateTimeLocalValue(start),
    endsAtLocal: toDateTimeLocalValue(end),
  };
}

function formStateFromEvent(event: ScheduleEvent): EventFormState {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    startsAtLocal: toDateTimeLocalValue(start),
    endsAtLocal: toDateTimeLocalValue(end),
    allDay: event.allDay,
    allDayDate: toDateInputValue(start),
    location: event.location,
    selectedUserIds: event.participants
      .filter((p) => p.userId)
      .map((p) => p.userId!)
      .filter((id) => id !== event.createdBy),
    selectedCreatorIds: event.participants
      .filter((p) => p.creatorId)
      .map((p) => p.creatorId!),
  };
}

export function SchedulePageClient({
  initialEvents,
  rangeStartIso,
  rangeEndIso,
  isStaff,
  isCreatorPortal,
  participantOptions = [],
}: SchedulePageClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(() =>
    defaultFormState(new Date())
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const dayEvents = useMemo(
    () => filterEventsForDay(events, selectedDay),
    [events, selectedDay]
  );

  const isBlockMode =
    isCreatorPortal && !isStaff && (editingEvent?.isBlock ?? form.eventType === "block");

  const schedulePreview = useMemo(() => {
    const resolved = resolveScheduleTimes({
      allDay: form.allDay,
      allDayDate: form.allDayDate,
      startsAtLocal: form.startsAtLocal,
      endsAtLocal: form.endsAtLocal,
    });
    if ("error" in resolved) return null;
    return formatSchedulePreview(
      new Date(resolved.startsAt),
      new Date(resolved.endsAt),
      form.allDay
    );
  }, [form]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  function openCreateModal(forBlock = false) {
    setEditingEvent(null);
    setForm(forBlock ? blockFormState(selectedDay) : defaultFormState(selectedDay));
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(event: ScheduleEvent) {
    setEditingEvent(event);
    setForm(formStateFromEvent(event));
    setError(null);
    setModalOpen(true);
  }

  function shiftWeek(delta: number) {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + delta * 7);
    setAnchorDate(next);
    setSelectedDay(next);
  }

  function toggleParticipant(option: ScheduleParticipantOption) {
    if (option.type === "user") {
      setForm((prev) => ({
        ...prev,
        selectedUserIds: prev.selectedUserIds.includes(option.id)
          ? prev.selectedUserIds.filter((id) => id !== option.id)
          : [...prev.selectedUserIds, option.id],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        selectedCreatorIds: prev.selectedCreatorIds.includes(option.id)
          ? prev.selectedCreatorIds.filter((id) => id !== option.id)
          : [...prev.selectedCreatorIds, option.id],
      }));
    }
  }

  function applyDurationPreset(preset: (typeof BLOCK_DURATION_PRESETS)[number]) {
    if ("allDay" in preset && preset.allDay) {
      setForm((prev) => ({
        ...prev,
        allDay: true,
        allDayDate: prev.allDayDate || toDateInputValue(selectedDay),
      }));
      return;
    }

    setForm((prev) => {
      const nextEnd = addHoursToDateTimeLocal(prev.startsAtLocal, preset.hours);
      return {
        ...prev,
        allDay: false,
        endsAtLocal: nextEnd ?? prev.endsAtLocal,
      };
    });
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveEvent();
  }

  async function saveEvent() {
    const resolved = resolveScheduleTimes({
      allDay: form.allDay,
      allDayDate: form.allDayDate,
      startsAtLocal: form.startsAtLocal,
      endsAtLocal: form.endsAtLocal,
    });

    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }

    const { startsAt, endsAt } = resolved;

    startTransition(async () => {
      setError(null);

      try {
        let result:
          | { error?: string; id?: string; success?: boolean }
          | undefined;

        if (isBlockMode) {
          const blockPayload = {
            title: form.title,
            startsAt,
            endsAt,
            allDay: form.allDay,
          };
          result = editingEvent
            ? await updateCreatorBlock(editingEvent.id, blockPayload)
            : await createCreatorBlock(blockPayload);
        } else if (isStaff) {
          const payload = {
            title: form.title,
            description: form.description,
            eventType: form.eventType,
            startsAt,
            endsAt,
            allDay: form.allDay,
            location: form.location,
            participantUserIds: form.selectedUserIds,
            participantCreatorIds: form.selectedCreatorIds,
          };
          result = editingEvent
            ? await updateScheduleEvent(editingEvent.id, payload)
            : await createScheduleEvent(payload);
        } else {
          setError("You do not have permission to save this event.");
          return;
        }

        if (result?.error) {
          setError(result.error);
          return;
        }

        setModalOpen(false);
        router.refresh();
      } catch (err) {
        setError(formatActionError(err));
      }
    });
  }

  function handleDelete(event: ScheduleEvent) {
    if (!confirm(`Delete "${event.title}"?`)) return;
    startTransition(async () => {
      try {
        const result = await deleteScheduleEvent(event.id);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        setEvents((prev) => prev.filter((item) => item.id !== event.id));
        router.refresh();
      } catch (err) {
        setError(formatActionError(err));
      }
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && !modalOpen ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-raised/60 text-gray-400 hover:text-white"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setAnchorDate(today);
              setSelectedDay(today);
            }}
            className="rounded-xl border border-white/[0.06] bg-surface-raised/60 px-3 py-2 text-sm text-gray-300 hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-raised/60 text-gray-400 hover:text-white"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-medium text-gray-300">
            {weekDays[0]?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {" – "}
            {weekDays[6]?.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {isCreatorPortal ? (
            <button
              type="button"
              onClick={() => openCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/[0.1]"
            >
              <Plus className="h-4 w-4" />
              Block time
            </button>
          ) : null}
          {isStaff ? (
            <button
              type="button"
              onClick={() => openCreateModal(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              New event
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Week view</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weekDays.map((day) => {
                const items = filterEventsForDay(events, day);
                const selected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-accent/40 bg-accent/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-accent/20"
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold",
                        isToday ? "text-accent-light" : "text-white"
                      )}
                    >
                      {day.getDate()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {items.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="truncate rounded-md px-1.5 py-0.5 text-[10px] text-gray-300"
                          style={{
                            backgroundColor: `${event.color}22`,
                            borderLeft: `2px solid ${event.color}`,
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {items.length > 3 ? (
                        <p className="text-[10px] text-gray-500">
                          +{items.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
            {isCreatorPortal ? (
              <button
                type="button"
                onClick={() => openCreateModal(true)}
                className="text-xs font-medium text-accent-light hover:text-white"
              >
                Block this day
              </button>
            ) : null}
          </CardHeader>
          <CardContent className="pt-0">
            {dayEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No events this day"
                description={
                  isCreatorPortal
                    ? "Block time when you're unavailable"
                    : "Schedule meetings, practice, or streams"
                }
                className="min-h-[12rem]"
              />
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <p className="truncate text-sm font-semibold text-white">
                            {event.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {event.timeRangeDisplay}
                          {!event.isBlock && (
                            <span> · {scheduleEventTypeLabels[event.eventType]}</span>
                          )}
                        </p>
                        {event.location ? (
                          <p className="mt-1 text-xs text-gray-600">
                            {event.location}
                          </p>
                        ) : null}
                        {event.participants.length > 0 && isStaff ? (
                          <p className="mt-1 text-xs text-gray-600">
                            {event.participants.length} participant
                            {event.participants.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </button>
                      {(isStaff || event.isBlock) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(event)}
                          disabled={pending}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`Delete ${event.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] bg-surface-raised p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">
              {editingEvent
                ? "Edit event"
                : isBlockMode
                  ? "Block time"
                  : "New event"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isBlockMode
                ? "Mark when you're unavailable so your team can plan around it."
                : "Set a time and invite teammates or creators."}
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleFormSubmit}>
              <label className="block">
                <span className="text-xs font-medium text-gray-400">Title</span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={isBlockMode ? "Blocked" : "Team sync"}
                  className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white"
                />
              </label>

              {isStaff && !editingEvent?.isBlock && !isBlockMode ? (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-400">Type</span>
                    <select
                      value={form.eventType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          eventType: e.target.value as ScheduleEventType,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white"
                    >
                      {scheduleEventTypes
                        .filter((type) => type !== "block")
                        .map((type) => (
                          <option key={type} value={type}>
                            {scheduleEventTypeLabels[type]}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-400">
                      Description
                    </span>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-400">
                      Location
                    </span>
                    <input
                      value={form.location}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Discord, office, or link"
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white"
                    />
                  </label>
                </>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allDay: e.target.checked,
                      allDayDate:
                        prev.allDayDate ||
                        toDateInputValue(parseDateFromLocal(prev.startsAtLocal)),
                    }))
                  }
                  className="rounded border-white/20"
                />
                All day
              </label>

              {form.allDay ? (
                <label className="block">
                  <span className="text-xs font-medium text-gray-400">Date</span>
                  <input
                    type="date"
                    value={form.allDayDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, allDayDate: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-400">
                      Starts
                    </span>
                    <input
                      type="datetime-local"
                      value={form.startsAtLocal}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startsAtLocal: e.target.value,
                          allDayDate: e.target.value.slice(0, 10),
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white [color-scheme:dark]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-400">Ends</span>
                    <input
                      type="datetime-local"
                      value={form.endsAtLocal}
                      min={form.startsAtLocal}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          endsAtLocal: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-white [color-scheme:dark]"
                    />
                  </label>
                </div>
              )}

              {isBlockMode ? (
                <div>
                  <p className="text-xs font-medium text-gray-400">Quick length</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BLOCK_DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyDurationPreset(preset)}
                        className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:border-accent/30 hover:text-white"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {schedulePreview ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-gray-300">
                  {schedulePreview}
                </p>
              ) : null}

              {isStaff && participantOptions.length > 0 && !isBlockMode ? (
                <div>
                  <p className="text-xs font-medium text-gray-400">Participants</p>
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] p-2">
                    {participantOptions.map((option) => {
                      const selected =
                        option.type === "user"
                          ? form.selectedUserIds.includes(option.id)
                          : form.selectedCreatorIds.includes(option.id);
                      return (
                        <label
                          key={`${option.type}-${option.id}`}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleParticipant(option)}
                          />
                          <span className="text-sm text-gray-300">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError(null);
                  }}
                  className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-gray-600">
        Showing events from{" "}
        {new Date(rangeStartIso).toLocaleDateString()} to{" "}
        {new Date(rangeEndIso).toLocaleDateString()}.
      </p>
    </div>
  );
}

function parseDateFromLocal(value: string): Date {
  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}
