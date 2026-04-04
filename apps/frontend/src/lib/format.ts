import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);

export const formatShortTime = (value: string) => dayjs(value).format("HH:mm");

export const elapsedMinutes = (value: string) => dayjs().diff(dayjs(value), "minute");
