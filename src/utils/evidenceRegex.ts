const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?)?$/i;
const localDate = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/;

export function parseEvidenceDate(value: string) {
  const iso = isoDate.exec(value.trim());
  const local = iso ? null : localDate.exec(value.trim());
  if (!iso && !local) return null;
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(local![4]), Number(local![3]), Number(local![1])];
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1] ? { year, month, day } : null;
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

function dateRegex(value: string) {
  const date = parseEvidenceDate(value);
  if (!date) return null;
  const { year, month, day } = date;
  const fullYear = pad(year, 4);
  const iso = `${fullYear}-${pad(month)}-${pad(day)}`;
  const local = `${day < 10 ? "0?" : ""}${day}([/.-])${month < 10 ? "0?" : ""}${month}\\1(?:${fullYear}|${pad(year % 100)})`;
  const digit = "\\p{Nd}";
  return new RegExp(`(?<!${digit}|${digit}[/.-])(?:${iso}|${local})(?!${digit}|[/.-]${digit})`, "gu");
}

function numberRegex(value: string) {
  const number = /^([+\-−]?)(?:(\d+)(?:[.,](\d+))?|[.,](\d+))$/.exec(value);
  if (!number) return null;
  const integer = (number[2] ?? "0").replace(/^0+(?=\d)/, "");
  const fraction = (number[3] ?? number[4] ?? "").replace(/0+$/, "");
  const zero = integer === "0" && !fraction;
  const sign = zero ? "[+−-]?" : /[−-]/.test(number[1]) ? "[−-]" : "\\+?";
  const decimal = fraction ? `[.,]${fraction}0*` : "(?:[.,]0+)?";
  const unsigned = integer === "0" && fraction
    ? `0*${decimal}`
    : `0*${integer}${decimal}`;
  return new RegExp(
    `(?<![\\p{L}\\p{M}\\p{N}_+−-]|\\d[.,])${sign}${unsigned}(?![\\p{L}\\p{M}\\p{N}_]|[.,]\\d)`,
    "gu",
  );
}

function textRegex(value: string) {
  const literal = value.split(/\s+/u)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const word = "[\\p{L}\\p{M}\\p{N}_]";
  const connector = "[.+/−-]";
  return new RegExp(`(?<!${word}|${word}${connector})${literal}(?!${word}|${connector}${word})`, "giu");
}

export function generateEvidenceRegex(value: string | null | undefined, valueType: string | undefined): RegExp | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  switch (valueType) {
    case "date": return dateRegex(trimmed);
    case "number": return numberRegex(trimmed);
    case "text": return textRegex(trimmed);
    default: return null;
  }
}
