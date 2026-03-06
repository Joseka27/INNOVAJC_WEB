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

  const [todayIndex, setTodayIndex] = useState<number | null>(null);

  function getCostaRicaDayIndex() {
    const dayName = new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      timeZone: "America/Costa_Rica",
    }).format(new Date());

    const normalized = dayName.toLowerCase();

    const dayMap: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miércoles: 3,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
      sabado: 6,
    };

    return dayMap[normalized];
  }

  useEffect(() => {
    function updateToday() {
      setTodayIndex(getCostaRicaDayIndex());
    }

    updateToday();

    const interval = setInterval(updateToday, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (todayIndex === null) {
    return (
      <div className="schedule">
        <h4 className="text-center">Horario de Atención</h4>
        {schedule.map((s) => (
          <div key={s.day} className="schedule-row">
            <span>{s.day}</span>
            <span>{s.hours}</span>
          </div>
        ))}
      </div>
    );
  }

  const isWeekend = todayIndex === 0 || todayIndex === 6;

  return (
    <div className="schedule">
      <h4 className="text-center">Horario de Atención</h4>

      {schedule.map((s, index) => {
        const isToday = index === todayIndex;

        return (
          <div
            key={s.day}
            className={`schedule-row ${
              isToday ? "today" : ""
            } ${isToday && isWeekend ? "today-closed" : ""}`}
          >
            <span>{s.day}</span>
            <span>{s.hours}</span>
          </div>
        );
      })}
    </div>
  );
}
