# Trip Weather Provider

The active-trip dashboard uses the public Open-Meteo Forecast API endpoint at `https://api.open-meteo.com/v1/forecast`. It sends the trip's resolved latitude and longitude with `current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` and `timezone=auto`. Open-Meteo documents that latitude/longitude are required WGS84 coordinates, `current` accepts current weather variables, and `timezone=auto` resolves local trip time. This view is advisory travel information, not a safety-critical forecast.

Source: https://open-meteo.com/en/docs
