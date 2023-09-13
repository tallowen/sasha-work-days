import { useState } from "react";
import { DateTime } from "luxon";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { getRenderedDates } from "./config";

export default function App() {
  const [date, setDate] = useState(DateTime.now());

  function onChange(
    value: DateValueType,
  ): void {
    if (value === null) {
      return;
    }
    const startDate = value.startDate;
    if (typeof startDate !== "string") {
      return;
    }

    setDate(DateTime.fromISO(startDate));
  }

  const { vacationDaysAccrued, vacationDaysTaken } = getRenderedDates(date);
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mt-6">As of</h1>
        <Datepicker
          placeholder={date.toISODate() || ""}
          value={{ startDate: date.toISODate(), endDate: null }}
          onChange={onChange}
          asSingle={true}
          primaryColor={"blue"} 
        />
        <h2 className="text-4xl font-bold mt-6">Vacation Days Accrued</h2>
        <p className="text-2xl">{vacationDaysAccrued.toFixed(2)}</p>
        <h2 className="text-4xl font-bold mt-6">Vacation Days Taken</h2>
        <p className="text-2xl">{vacationDaysTaken}</p>
      </div>
    </div>
  );
}
