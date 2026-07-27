// isoDate is a plain "YYYY-MM-DD" string - reformat via string split rather
// than `new Date()`, which parses it as UTC midnight and can shift the date
// when read back in a negative-UTC-offset local timezone.
export default function formatDateDMY(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}
