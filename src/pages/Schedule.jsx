import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight,
    Plus, Edit, Trash2, X, Save, Settings, Filter, LayoutGrid, List, CalendarDays, Check,
    Eye, Download
} from "lucide-react";
import routineImg from '../contents/RoutineV1.png';

// Helper to get week number for "Alter Class" logic
const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

// Days of the week
// Days of the week
const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const EVENT_TYPES = ["Class", "Lab", "Break", "Tiffin", "Prayer", "Exam"];

// Time Slots Configuration
const TIME_SLOTS = [
    { label: "08:00-09:15", start: "08:00", end: "09:15" },
    { label: "09:15-10:30", start: "09:15", end: "10:30" },
    { label: "10:45-12:00", start: "10:45", end: "12:00" },
    { label: "12:00-01:15", start: "12:00", end: "13:15" },
    { label: "02:00-03:15", start: "14:00", end: "15:15" },
    { label: "03:15-04:30", start: "15:15", end: "16:30" }
];

const FRIDAY_SLOTS = [
    { label: "08:00-09:15", start: "08:00", end: "09:15" },
    { label: "09:15-10:30", start: "09:15", end: "10:30" },
    { label: "10:30-11:45", start: "10:30", end: "11:45" },
    { label: "11:45-01:00", start: "11:45", end: "13:00" },
    { label: "01:00-03:15", start: "13:00", end: "15:15" }, // Combined break/prayer slot based on gap
    { label: "03:15-04:30", start: "15:15", end: "16:30" }
];

export default function Schedule() {
    const { user, isAdmin, hasPermission } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [courses, setCourses] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("week"); // week, day, month
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [visibleDays, setVisibleDays] = useState(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    const [isPrecisionMode, setIsPrecisionMode] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: "",
        day: "Sunday",
        startTime: "09:00",
        endTime: "10:30",
        type: "Class",
        courseId: "",
        courseName: "",
        instructor: "",
        room: "",
        recurrence: "weekly", // weekly, odd, even
        color: "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800"
    });

    useEffect(() => {
        fetchSchedule();
        fetchCourses();
        fetchSettings();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/schedule");
            setSchedule(await res.json());
        } catch (error) {
            console.error("Failed to fetch schedule:", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/courses");
            setCourses(await res.json());
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("http://localhost:3001/api/settings");
            const data = await res.json();
            if (data.visibleDays) setVisibleDays(data.visibleDays);
            if (data.defaultScheduleView) {
                setIsPrecisionMode(data.defaultScheduleView === 'precision');
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    const saveSettings = async (newVisibleDays) => {
        try {
            await fetch("http://localhost:3001/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visibleDays: newVisibleDays })
            });
            setVisibleDays(newVisibleDays);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    };

    // Navigation Logic
    const nextPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "day") newDate.setDate(newDate.getDate() + 1);
        if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
        if (viewMode === "2week") newDate.setDate(newDate.getDate() + 14);
        if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const prevPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "day") newDate.setDate(newDate.getDate() - 1);
        if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
        if (viewMode === "2week") newDate.setDate(newDate.getDate() - 14);
        if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    // Admin Handlers
    const handleAddNew = () => {
        setEditingEvent(null);
        setFormData({
            id: `sched-${Date.now()}`,
            day: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
            startTime: "09:00",
            endTime: "10:30",
            type: "Class",
            courseId: "",
            courseName: "",
            instructor: "",
            room: "",
            recurrence: "weekly",
            color: "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800"
        });
        setIsModalOpen(true);
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData(event);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) {
            if (!window.confirm("Send deletion request for this event?")) return;
            try {
                const response = await fetch("http://localhost:3001/api/deletion-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "schedule",
                        resourceId: id,
                        details: { title: schedule.find(s => s.id === id)?.courseName || "Event" },
                        requestedBy: user.username
                    })
                });
                if (response.ok) alert("Deletion request sent to Admin.");
                else alert("Failed to send request.");
            } catch (err) {
                alert("Failed to send request.");
            }
            return;
        }

        if (!window.confirm("Delete this schedule entry?")) return;
        try {
            await fetch(`http://localhost:3001/api/schedule/${id}`, { method: "DELETE" });
            fetchSchedule();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:3001/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, username: user.username })
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchSchedule();
            }
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };

    const handleCourseSelect = (e) => {
        const courseId = e.target.value;
        const selectedCourse = courses.find(c => c.id === courseId);
        if (selectedCourse) {
            setFormData({
                ...formData,
                courseId: selectedCourse.id,
                courseName: selectedCourse.name,
                instructor: selectedCourse.instructor
            });
        } else {
            setFormData({ ...formData, courseId: "", courseName: "", instructor: "" });
        }
    };

    // Rendering Helpers
    const getEventsForDay = (date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const weekNum = getWeekNumber(date);
        const isOddWeek = weekNum % 2 !== 0;

        return schedule.filter(event => {
            if (event.day !== dayName) return false;
            // Alter class logic
            if (event.recurrence === "odd" && !isOddWeek) return false;
            if (event.recurrence === "even" && isOddWeek) return false;
            return true;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getWeekStartDate = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff)); // Returns Monday
    };

    // Formatting Helpers
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Helper to check if event falls in slot
    const isEventInSlot = (event, slot) => {
        // Simple string comparison for now, can be more robust with Date objects if needed
        return event.startTime >= slot.start && event.startTime < slot.end;
    };

    // Calculate span
    const calculateEventSpan = (event, slots) => {
        let startIndex = -1;
        let endIndex = -1;

        slots.forEach((slot, i) => {
            if (event.startTime >= slot.start && event.startTime < slot.end) {
                startIndex = i;
            }
            // Logic to find end slot: intersection or simple cover
            // If event ends after slot start, it touches this slot
            // We want inclusive span
            if (event.endTime > slot.start && event.endTime <= slot.end) {
                endIndex = i;
            } else if (event.endTime > slot.end) {
                endIndex = i; // at least this far
            }
        });

        // Refined End Index search if simple logic didn't catch specific overlap
        // Actually, let's just find the index of the slot where it starts, and the index where it ends (exclusive) - 1
        // But slots have gaps.
        // Let's iterate and count how many slots it overlaps.

        let span = 0;
        let startFound = false;

        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            // Check overlap
            // Event overlaps slot if event.start < slot.end && event.end > slot.start
            if (event.startTime < slot.end && event.endTime > slot.start) {
                span++;
                if (!startFound) {
                    startIndex = i;
                    startFound = true;
                }
            }
        }

        return { span: span > 0 ? span : 1, startIndex };
    };

    // Components
    const EventCard = ({ event, compact = false }) => (
        <div
            className={`p-2 rounded-md border ${event.color} ${compact ? 'text-xs' : ''} h-full w-full relative group transition-all hover:shadow-md cursor-pointer flex flex-col justify-center`}
            onClick={() => hasPermission('schedule_edit') && handleEdit(event)}
        >
            <div className={`flex items-center justify-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300 ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}>
                {!compact && <Clock className="w-3.5 h-3.5" />}
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </div>
            <div className="font-bold text-center text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-tight">
                {event.courseId} {event.courseName && <span className="block text-[10px] font-normal my-0.5">{event.courseName}</span>}
            </div>
            {(event.type === "Class" || event.type === "Lab") && (
                <>
                    <div className="text-center font-bold text-gray-800 dark:text-gray-200 text-[11px] mt-1">
                        {event.instructor}
                    </div>
                    {event.room && (
                        <div className="text-center text-[10px] font-mono text-gray-600 dark:text-gray-400 mt-0.5 bg-white/40 dark:bg-black/20 rounded px-1 inline-block mx-auto">
                            {event.room}
                        </div>
                    )}
                </>
            )}

            {hasPermission('schedule_edit') && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={prevPeriod} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {viewMode === 'month'
                                ? currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
                                : currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
                            }
                        </h2>
                        {viewMode !== 'month' && viewMode !== 'day' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Week {getWeekNumber(currentDate)} {viewMode === '2week' && `& ${getWeekNumber(currentDate) + 1}`}
                            </p>
                        )}
                    </div>
                    <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPrecisionMode(!isPrecisionMode)}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                        title={isPrecisionMode ? "Switch to Classic View" : "Switch to Precision View"}
                    >
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {isPrecisionMode ? "Precision" : "Classic"}
                        </span>
                        <div className={`w-8 h-4 rounded-full transition-colors relative ${isPrecisionMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isPrecisionMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['day', 'week', '2week', 'month'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${viewMode === mode
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {mode === '2week' ? '2 Weeks' : mode}
                            </button>
                        ))}
                    </div>
                </div>

                {hasPermission('schedule_edit') && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Schedule Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-colors font-medium"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Class
                        </button>
                    </div>
                )}
            </div>

            {/* Views */}
            {viewMode === 'day' && (
                <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 mb-4">
                        {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </h3>
                    {getEventsForDay(currentDate).length > 0 ? (
                        getEventsForDay(currentDate).map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 italic">
                            No classes scheduled for today.
                        </div>
                    )}
                </div>
            )}

            {(viewMode === 'week' || viewMode === '2week') && (
                <div className="space-y-8 overflow-x-auto pb-4">
                    {isPrecisionMode ? (
                        /* Unified Time Grid (Sat-Fri) */
                        <div className="min-w-[900px] border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 relative">
                            {/* 1. Header Row (Time Ticks) */}
                            <div className="flex border-b border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 sticky top-0 z-20">
                                <div className="flex-shrink-0 w-24 p-3 font-bold text-center border-r border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-700 sticky left-0 z-20">
                                    Day
                                </div>
                                <div className="flex-grow relative h-10">
                                    {/* Render Hour Markers: 08:00 to 17:00 */}
                                    {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => (
                                        <div
                                            key={hour}
                                            className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-slate-600 text-[10px] font-bold text-gray-400 pl-1"
                                            style={{ left: `${((hour - 8) / 9) * 100}%` }}
                                        >
                                            {hour > 12 ? hour - 12 : hour}:00
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Days Rows */}
                            {(viewMode === '2week' ? [0, 1] : [0]).map(weekOffset => (
                                <React.Fragment key={weekOffset}>
                                    {visibleDays.map((day) => {
                                        // Calculate Date
                                        const startOfWeek = new Date(currentDate);
                                        const daysPastSaturday = (currentDate.getDay() + 1) % 7;
                                        startOfWeek.setDate(currentDate.getDate() - daysPastSaturday + (weekOffset * 7));

                                        const dayIndex = DAYS.indexOf(day);
                                        const dayDate = new Date(startOfWeek);
                                        dayDate.setDate(startOfWeek.getDate() + dayIndex);
                                        const isToday = dayDate.toDateString() === new Date().toDateString();

                                        const dayEvents = getEventsForDay(dayDate);

                                        return (
                                            <div key={`${day}-${weekOffset}`} className={`flex border-b border-gray-300 dark:border-slate-600 last:border-b-0 h-28 ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'}`}>
                                                {/* Day Name Column */}
                                                <div className="flex-shrink-0 w-24 p-2 font-bold flex flex-col items-center justify-center border-r border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/50 sticky left-0 z-10">
                                                    <span>{day}</span>
                                                    <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                                                        {dayDate.getDate()}/{dayDate.getMonth() + 1}
                                                    </span>
                                                </div>

                                                {/* Timeline Container */}
                                                <div className="flex-grow relative">
                                                    {/* Background Grid Lines (Hours) */}
                                                    {Array.from({ length: 9 }, (_, i) => i + 8).map((hour) => (
                                                        <div
                                                            key={`grid-${hour}`}
                                                            className="absolute top-0 bottom-0 border-l border-dashed border-gray-200 dark:border-slate-700 pointer-events-none"
                                                            style={{ left: `${((hour - 8) / 9) * 100}%` }}
                                                        ></div>
                                                    ))}

                                                    {/* Events */}
                                                    {dayEvents.map(ev => {
                                                        // Calculate Position
                                                        const [startH, startM] = ev.startTime.split(':').map(Number);
                                                        const [endH, endM] = ev.endTime.split(':').map(Number);

                                                        const startMinutes = startH * 60 + startM;
                                                        const endMinutes = endH * 60 + endM;

                                                        // Total range: 08:00 (480m) to 17:00 (1020m) -> 540m duration
                                                        const dayStartMinutes = 8 * 60;
                                                        const totalDayMinutes = 9 * 60; // 9 hours

                                                        const leftPercent = ((startMinutes - dayStartMinutes) / totalDayMinutes) * 100;
                                                        const widthPercent = ((endMinutes - startMinutes) / totalDayMinutes) * 100;

                                                        return (
                                                            <div
                                                                key={ev.id}
                                                                className="absolute top-1 bottom-1 px-0.5 transition-all hover:z-20"
                                                                style={{
                                                                    left: `${leftPercent}%`,
                                                                    width: `${widthPercent}%`
                                                                }}
                                                            >
                                                                <EventCard event={ev} compact={true} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Classic Slot View - Sat-Thu */}
                            <div className="min-w-[800px] border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600 flex">
                                    <div className="w-24 p-3 font-bold text-center border-r border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-200 dark:bg-slate-700 mr-2 rounded-r-md">Time</div>
                                    {TIME_SLOTS.map((slot, i) => (
                                        <div key={i} className={`flex-1 p-2 text-center font-bold text-sm border-r border-gray-300 dark:border-slate-600 last:border-r-0 flex items-center justify-center bg-gray-200 dark:bg-slate-700 ${(i === 1 || i === 3) ? 'mr-2 rounded-r-md' : ''}`}>
                                            {slot.label}
                                        </div>
                                    ))}
                                </div>
                                {(viewMode === '2week' ? [0, 1] : [0]).map(weekOffset => (
                                    <React.Fragment key={weekOffset}>
                                        {visibleDays.filter(d => d !== "Friday").map((day) => {
                                            const startOfWeek = new Date(currentDate);
                                            const daysPastSaturday = (currentDate.getDay() + 1) % 7;
                                            startOfWeek.setDate(currentDate.getDate() - daysPastSaturday + (weekOffset * 7));

                                            const dayIndex = DAYS.indexOf(day);
                                            const dayDate = new Date(startOfWeek);
                                            dayDate.setDate(startOfWeek.getDate() + dayIndex);
                                            const isToday = dayDate.toDateString() === new Date().toDateString();

                                            const dayEvents = getEventsForDay(dayDate);

                                            return (
                                                <div key={`${day}-${weekOffset}`} className={`flex border-b border-gray-300 dark:border-slate-600 last:border-b-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                                    <div className="w-24 p-2 font-bold flex flex-col items-center justify-center border-r border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/50 mr-2 rounded-r-md">
                                                        <span>{day}</span>
                                                        <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                                                            {dayDate.getDate()}/{dayDate.getMonth() + 1}
                                                        </span>
                                                    </div>
                                                    {TIME_SLOTS.map((slot, i) => {
                                                        const eventsStartingHere = dayEvents.filter(ev => {
                                                            const { startIndex } = calculateEventSpan(ev, TIME_SLOTS);
                                                            return startIndex === i;
                                                        });

                                                        return (
                                                            <div key={i} className={`flex-1 p-1 border-r border-gray-300 dark:border-slate-600 last:border-r-0 min-h-[100px] relative hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${(i === 1 || i === 3) ? 'mr-2 rounded-r-md' : ''}`}>
                                                                {eventsStartingHere.map(ev => {
                                                                    const { span } = calculateEventSpan(ev, TIME_SLOTS);
                                                                    const widthStyle = span > 1 ? `calc(${span * 100}% + ${span - 1}px)` : '100%';

                                                                    return (
                                                                        <div key={ev.id} style={{ width: widthStyle, position: 'relative', zIndex: span > 1 ? 10 : 1 }} className="h-full">
                                                                            <EventCard event={ev} compact={true} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* FRIDAY Table */}
                            {visibleDays.includes("Friday") && (
                                <div className="min-w-[800px] border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden mt-8">
                                    <div className="bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600 flex">
                                        <div className="w-24 p-3 font-bold text-center border-r border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-200 dark:bg-slate-700 mr-2 rounded-r-md">Time</div>
                                        {FRIDAY_SLOTS.map((slot, i) => (
                                            <div key={i} className="flex-1 p-2 text-center font-bold text-sm border-r border-gray-300 dark:border-slate-600 last:border-r-0 flex items-center justify-center bg-gray-200 dark:bg-slate-700">
                                                {slot.label}
                                            </div>
                                        ))}
                                    </div>
                                    {((viewMode === '2week' ? [0, 1] : [0]).map(weekOffset => (
                                        <React.Fragment key={weekOffset}>
                                            {(() => {
                                                const startOfWeek = new Date(currentDate);
                                                const daysPastSaturday = (currentDate.getDay() + 1) % 7;
                                                startOfWeek.setDate(currentDate.getDate() - daysPastSaturday + (weekOffset * 7));

                                                const dayIndex = DAYS.indexOf("Friday");
                                                const dayDate = new Date(startOfWeek);
                                                dayDate.setDate(startOfWeek.getDate() + dayIndex);
                                                const isToday = dayDate.toDateString() === new Date().toDateString();
                                                const dayEvents = getEventsForDay(dayDate);

                                                return (
                                                    <div className={`flex border-b border-gray-300 dark:border-slate-600 last:border-b-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'}`}>
                                                        <div className="w-24 p-2 font-bold flex flex-col items-center justify-center border-r border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/50 mr-2 rounded-r-md">
                                                            <span>Friday</span>
                                                            <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                                                                {dayDate.getDate()}/{dayDate.getMonth() + 1}
                                                            </span>
                                                        </div>
                                                        {FRIDAY_SLOTS.map((slot, i) => {
                                                            const eventsStartingHere = dayEvents.filter(ev => {
                                                                const { startIndex } = calculateEventSpan(ev, FRIDAY_SLOTS);
                                                                return startIndex === i;
                                                            });

                                                            return (
                                                                <div key={i} className="flex-1 p-1 border-r border-gray-300 dark:border-slate-600 last:border-r-0 min-h-[100px] relative hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                                    {eventsStartingHere.map(ev => {
                                                                        const { span } = calculateEventSpan(ev, FRIDAY_SLOTS);
                                                                        const widthStyle = span > 1 ? `calc(${span * 100}% + ${span - 1}px)` : '100%';
                                                                        return (
                                                                            <div key={ev.id} style={{ width: widthStyle, position: 'relative', zIndex: span > 1 ? 10 : 1 }} className="h-full">
                                                                                <EventCard event={ev} compact={true} />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </React.Fragment>
                                    )))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}


            {
                viewMode === 'month' && (
                    <div className="grid grid-cols-7 gap-1 lg:gap-2">
                        {DAYS.map(d => (
                            <div key={d} className="text-center font-bold text-gray-600 dark:text-gray-400 py-2 text-sm">{d.slice(0, 3)}</div>
                        ))}
                        {Array.from({ length: (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 1) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24 md:h-32 bg-transparent"></div>
                        ))}
                        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                            const events = getEventsForDay(d);
                            const isToday = d.toDateString() === new Date().toDateString();

                            return (
                                <div key={i} className={`h-24 md:h-32 border dark:border-slate-700 bg-white dark:bg-slate-800 p-1 md:p-2 overflow-y-auto rounded-lg ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                                    <div className={`text-right text-xs font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{i + 1}</div>
                                    {events.map(ev => (
                                        <div key={ev.id} className={`text-[10px] p-1 rounded mb-1 truncate ${ev.color} ${ev.type === 'Class' ? 'text-blue-800 dark:text-blue-100' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {ev.startTime} {ev.courseId ? `${ev.courseId} (${ev.type})` : ev.type} {ev.room && `[${ev.room}]`}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Analog Routine Section */}
            <div className="mt-16 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    If You don't understand the Digital Dynamic Routine then the Analog one is here
                </h2>
                <div className="max-w-4xl mx-auto bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-8 border border-gray-200 dark:border-slate-700">
                    <img src={routineImg} alt="Analog Routine" className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-center space-x-4">
                    <a
                        href={routineImg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Eye className="w-5 h-5 mr-2" />
                        View Full Size
                    </a>
                    <a
                        href={routineImg}
                        download="RoutineV1.png"
                        className="flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium rounded-xl transition-colors shadow-lg"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Download Image
                    </a>
                </div>
            </div>

            {/* Admin Settings Modal */}
            {
                isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                    <Settings className="w-5 h-5 mr-2" />
                                    Schedule Settings
                                </h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Visible Days (Work Week)</h3>
                                <div className="space-y-2">
                                    {DAYS.map(day => (
                                        <label key={day} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${visibleDays.includes(day) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                                                {visibleDays.includes(day) && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={visibleDays.includes(day)}
                                                onChange={() => {
                                                    const newDays = visibleDays.includes(day)
                                                        ? visibleDays.filter(d => d !== day)
                                                        : [...visibleDays, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
                                                    saveSettings(newDays);
                                                }}
                                            />
                                            <span className={`text-sm ${visibleDays.includes(day) ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {day}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-4 px-1">
                                    Changes are saved automatically and affect all users.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Admin Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {editingEvent ? "Edit Class" : "Add Class"}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day</label>
                                        <select
                                            value={formData.day}
                                            onChange={e => setFormData({ ...formData, day: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {(formData.type === "Class" || formData.type === "Lab" || formData.type === "Exam") && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course (Optional)</label>
                                            <select
                                                value={formData.courseId}
                                                onChange={handleCourseSelect}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select a Course...</option>
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name</label>
                                            <input
                                                type="text"
                                                value={formData.courseName}
                                                onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g. Artificial Intelligence"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructor</label>
                                                <input
                                                    type="text"
                                                    value={formData.instructor}
                                                    onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
                                                <input
                                                    type="text"
                                                    value={formData.room}
                                                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g. 204"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurrence</label>
                                    <select
                                        value={formData.recurrence}
                                        onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="weekly">Every Week</option>
                                        <option value="odd">Odd Weeks Only (Alter)</option>
                                        <option value="even">Even Weeks Only (Alter)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-slate-700">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-200 dark:shadow-none font-medium flex items-center">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Class
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
