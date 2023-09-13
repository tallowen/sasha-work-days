import Ajv, { JTDDataType } from "ajv/dist/jtd";
import vacationConfig from "./vacationConfig.yaml";
import { DefinedError } from "ajv";
import { DateTime } from "luxon";

console.log('vacationconfig', vacationConfig);

const ajv = new Ajv();

const configSchema = {
  properties: {
    startDate: { type: "string" },
    holidays: { elements: { type: "string" } },
    vacations: { values: { elements: { type: "string" } } },
    vacationDaysPerYear: { type: "uint32" },
  },
} as const;

type configType = JTDDataType<typeof configSchema>;
const validateConfig = ajv.compile<configType>(configSchema);

let validatedConfig: configType | null = null;
function getValidatedConfig(): configType {
  if (validatedConfig) {
    return validatedConfig;
  }
  if (validateConfig(vacationConfig)) {
    validatedConfig = vacationConfig;
    return vacationConfig;
  } else {
    for (const err of validateConfig.errors as DefinedError[]) {
      console.log("Config validation error", err);
    }
    throw new Error("Invalid config");
  }
}

function getStartDate(): DateTime {
  const startTime = DateTime.fromISO(getValidatedConfig().startDate);
  if (startTime.toISODate() === null) {
    throw new Error('misconfigured start date');
  }
  return startTime;
}

function dateToISOO(date: DateTime): string {
  return date.toISODate()!;
}

function generateWeekdaysAndDaysWorked(endDate: DateTime): {
  workingWeekdays: Array<DateTime>;
  daysSinceStartDate: number;
} {
  const startDate = getStartDate();
  const holidays = getValidatedConfig().holidays;
  let weekdays: Array<DateTime> = [startDate];
  let offset = 1;
  while (true) {
    const nextDate = startDate.plus({days: offset});
    if (nextDate > endDate) {
      break;
    }
    // Saturday and Sunday
    if (nextDate.weekday !== 6 && nextDate.weekday !== 7) {
      if (!(holidays.includes(dateToISOO(nextDate)))) {
        weekdays.push(nextDate);
      }
    }
    offset++;
  }
  return {
    workingWeekdays: weekdays,
    daysSinceStartDate: offset,
  };
}

function getVacationDays(): Array<string> {
  const vacationLists = Object.values(getValidatedConfig().vacations);
  return vacationLists.flat();
}

export function getRenderedDates(inputDate: DateTime): {
  workdaysSinceStart: number,
  vacationDaysAccrued: number,
  vacationDaysTaken: number,
} {
  const { workingWeekdays, daysSinceStartDate } = generateWeekdaysAndDaysWorked(
    inputDate
  );
  console.log('days since start date', daysSinceStartDate);
  console.log('working weekdays', workingWeekdays.map(dateToISOO));
  const vacationAccrued =
    ((daysSinceStartDate + 1) * getValidatedConfig().vacationDaysPerYear) / 365;
  
  const vacationDays = getVacationDays();
  const vacationTakenDays = workingWeekdays.map(dateToISOO).filter(weekday => vacationDays.indexOf(weekday) !== -1);
  return {
    workdaysSinceStart: workingWeekdays.length,
    vacationDaysTaken: vacationTakenDays.length,
    vacationDaysAccrued: vacationAccrued,
  };
}
