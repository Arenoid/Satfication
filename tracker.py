import argparse
from skyfield.api import load, wgs84 , EarthSatellite

def track_satellite(lat, lon):
    ts = load.timescale()
    url = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE'
    satellites = load.tle_file(url, reload = True)
    
    if not satellites:
        print("No Satellites were found check the data file.")
        return

    iss = satellites[0]
    
    
    observer = wgs84.latlon(lat,lon)
    t0 = ts.now()
    t1 = ts.utc(t0.utc_datetime().year, t0.utc_datetime().month, t0.utc_datetime().day + 1)

    times, events = iss.find_events(observer, t0, t1, altitude_degrees = 10.0)
    print(f"----Live Location for ISS: {lat}N, {lon}E")
    for ti, event in zip(times, events):
        name = ('rise', 'culminate', 'set')[event]
        print(f"{ti.utc_strftime('%Y-%m-%d %H:%M:%S')} UTC")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description= "Satellite Pass Prediction")
    parser.add_argument("--Lat", type = float, required=True, help = "Latitude of observer")
    parser.add_argument("--lon", type = float, required = True, help = "Longitude of the observer")

    args = parser.parse_args()
    track_satellite(args.Lat, args.lon)
