import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, BookOpen, User } from 'lucide-react';
import scheduleData from '../data/schedule.json';

export default function DailyRoutine() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Helper: Go to previous day
    const prevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    // Helper: Go to next day
    const nextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    // Filter schedule for the selected day
    const todaysClasses = useMemo(() => {
        const dayName = days[selectedDate.getDay()];
        return scheduleData
            .filter(item => item.day === dayName)
            .sort((a, b) => {
                // Simple string comparison works for 24h format "09:00" vs "10:00"
                return a.startTime.localeCompare(b.startTime);
            });
    }, [selectedDate]);

    const isToday = new Date().toDateString() === selectedDate.toDateString();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                        {isToday ? "Today's Routine" : days[selectedDate.getDay()]}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={prevDay}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                        title="Previous Day"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={nextDay}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                        title="Next Day"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {todaysClasses.length > 0 ? (
                    todaysClasses.map(item => (
                        <div key={item.id} className="relative pl-4 border-l-2 border-gray-100 dark:border-slate-700 last:pb-0 pb-4">
                            {/* Dot indicator */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${item.type === 'Lab' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>

                            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight" title={item.courseName}>
                                            {item.courseName}
                                        </h3>
                                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                            <BookOpen className="w-3 h-3 mr-1" />
                                            {item.courseId}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0 ml-2 ${item.type === 'Lab'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {item.instructor && (
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                            <User className="w-3 h-3 mr-2 text-gray-400" />
                                            <span className="line-clamp-1" title={item.instructor}>{item.instructor}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                                        <div className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                                            {item.startTime} - {item.endTime}
                                        </div>
                                        {item.room && (
                                            <div className="flex items-center">
                                                <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
                                                Room {item.room}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No classes today</p>
                        <p className="text-xs text-gray-400 mt-1">Enjoy your free time!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
