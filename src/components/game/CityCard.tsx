import { Card, CardContent } from "../ui/card";
import type { City } from "./types";

type CityCardProps = {
  city: City | null;
  label: string;
  temperatureLabel: string;
  emptyLabel: string;
};

export function CityCard({
  city,
  label,
  temperatureLabel,
  emptyLabel,
}: CityCardProps) {
  return (
    <Card size="sm" className="w-72 text-center shadow-lg">
      {city?.img ? (
        <img
          src={city.img}
          alt={city.name}
          className="h-40 w-full object-contain bg-white p-4"
        />
      ) : null}
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">{label}</p>
        <h2 className="text-2xl font-bold">
          {city ? `${city.name}, ${city.country}` : emptyLabel}
        </h2>
        <p className="mt-2 text-xl">
          {city ? temperatureLabel : "--"}
        </p>
      </CardContent>
    </Card>
  );
}
