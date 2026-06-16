import Image from 'next/image';

interface Props {
  icon: string;   // OpenWeatherMap icon code e.g. "01d"
  size?: number;
}

export default function WeatherIcon({ icon, size = 40 }: Props) {
  return (
    <Image
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={icon}
      width={size}
      height={size}
      unoptimized
    />
  );
}
