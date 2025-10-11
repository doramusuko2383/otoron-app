const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDate(dateLike) {
  if (!dateLike) return new Date();
  if (dateLike instanceof Date) return new Date(dateLike.getTime());
  return new Date(dateLike);
}

export function toJstDate(dateLike = new Date()) {
  const base = toDate(dateLike);
  if (Number.isNaN(base.getTime())) return new Date(NaN);
  return new Date(base.getTime() + JST_OFFSET_MS);
}

export function toJstYmd(dateLike = new Date()) {
  const jstDate = toJstDate(dateLike);
  if (Number.isNaN(jstDate.getTime())) return "";
  return jstDate.toISOString().split("T")[0];
}

export function getJstDayRange(dateLike = new Date()) {
  const ymd = typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)
    ? dateLike
    : toJstYmd(dateLike);

  if (!ymd) {
    return {
      ymd: "",
      startDate: null,
      endDate: null,
      startUtcIso: "",
      endUtcIso: ""
    };
  }

  const startDate = new Date(`${ymd}T00:00:00+09:00`);
  if (Number.isNaN(startDate.getTime())) {
    return {
      ymd: "",
      startDate: null,
      endDate: null,
      startUtcIso: "",
      endUtcIso: ""
    };
  }

  const endDate = new Date(startDate.getTime() + MS_PER_DAY);
  return {
    ymd,
    startDate,
    endDate,
    startUtcIso: startDate.toISOString(),
    endUtcIso: endDate.toISOString()
  };
}

export function addJstDays(dateLike, days) {
  const { startDate } = getJstDayRange(dateLike);
  if (!startDate) return "";
  const target = new Date(startDate.getTime() + days * MS_PER_DAY);
  return toJstYmd(target);
}

export const __TESTING__ = {
  JST_OFFSET_MS,
  MS_PER_DAY
};

