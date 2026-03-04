"use client";

import { useEffect, useState } from "react";

export default function FooterSchedule() {
  const schedule = [
    { day: "Domingo", hours: "Cerrado" },
    { day: "Lunes", hours: "8:00 AM - 5:30 PM" },
    { day: "Martes", hours: "8:00 AM - 5:30 PM" },
    { day: "Miércoles", hours: "8:00 AM - 5:30 PM" },
    { day: "Jueves", hours: "8:00 AM - 5:30 PM" },
    { day: "Viernes", hours: "8:00 AM - 5:30 PM" },
    { day: "Sábado", hours: "Cerrado" },
  ];

  const [todayIndex, setTodayIndex] = useState(() => new Date().getDay());

  useEffect(() => {
    function scheduleNextUpdate() {
      const now = new Date();

      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);

      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        setTodayIndex(new Date().getDay());
        scheduleNextUpdate();
      }, msUntilMidnight);

      return timeout;
    }

    const timeout = scheduleNextUpdate();

    return () => clearTimeout(timeout);
  }, []);

  const isWeekend = todayIndex === 0 || todayIndex === 6;

  return (
    <div className="schedule">
      <h4 className="text-center">Horario de Atención</h4>

      {schedule.map((s, index) => {
        const isToday = index === todayIndex;

        return (
          <div
            key={s.day}
            className={`schedule-row 
              ${isToday ? "today" : ""} 
              ${isToday && isWeekend ? "today-closed" : ""}
            `}
          >
            <span>{s.day}</span>
            <span>{s.hours}</span>
          </div>
        );
      })}
    </div>
  );
}
