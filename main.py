import time
import argparse
import urllib.error
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from skyfield.api import load,wgs84
from skyfield.sgp4lib import EarthSatellite
from datetime import datetime, timedelta
import math

app = Flask(__name__)
CORS(app)

class SatelliteEngine:
    def __init__(self, norad_id: int, cache_duration: int = 86400):
        self.norad_id = norad_id
        self.cache_duration = cache_duration
        self.filename = Path(f'sat_{norad_id}.tle')

    def get_satellite(self):
        satellites = None

        if self.filename.exists() and (time.time()- self.filename.stat().st_mtime < self.cache_duration):
            try:
                print(f"Loading..")
                satellites = load.tle_file(str(self.filename))
            except Exception:
                print("Corrupted! Deleting the file")
                self.filename.unlink(missing_ok=True)
            
        if not satellites:
                print("Downloading data..")
                url = f'https://celestrak.org/NORAD/elements/gp.php?CATNR={self.norad_id}&FORMAT=TLE'
                try:
                    satellites = load.tle_file(url, reload = False, filename=str(self.filename))
                except urllib.error.HTTPError as e:
                    raise ValueError(f"Satellite ID {self.norad_id} not found in CelesTrak")
                except Exception as e:
                    raise ValueError(f"Network Error")
                
        if not satellites:
            raise ValueError(f"Failed to parse TLE for ID: {self.norad_id}")
            
        return satellites[0]

ts = load.timescale()


class PassPredicter:
    def __init__(self, satellite, lat:float, lon: float, horizon_degrees: float = 10.0):
        self.satellite = satellite
        self.observer = wgs84.latlon(lat,lon)
        self.horizon = horizon_degrees
        self.ts = ts


    def generate_passes(self):
        t0 = self.ts.now()
        t1 = self.ts.utc(t0.utc_datetime().year, t0.utc_datetime().month, t0.utc_datetime().day + 1)
        times, events = self.satellite.find_events(self.observer, t0, t1, altitude_degrees = self.horizon)

        pass_list = []
        current_pass = {}

        for ti, event in zip(times,events):
            event_name = ('rise', 'culminate', 'set')[event]

            difference = self.satellite - self.observer
            distance_km = difference.at(ti).distance().km

            if event_name == 'rise':
                current_pass = {"rise": ti.utc_strftime('%Y-%m-%d %H:%M:%S')}
            
            elif event_name == 'culminate':
                if not current_pass:
                    current_pass = {"rise": "Already Overhead"}
                current_pass["closest_approach_km"] = round(distance_km, 2)
                current_pass["peak_time"] = ti.utc_strftime('%H:%M:%S')

            elif event_name == 'set':
                if not current_pass:
                    current_pass = {"rise": "Already Overhead", "closest_approach_km": "N/A", "peak_time": "N/A"}
                current_pass["set"] = ti.utc_strftime('%H:%M:%S')
                pass_list.append(current_pass)
                current_pass = {}

        return pass_list
    
    def get_nearest_distance(self):
        t_now = self.ts.now()
        difference = self.satellite-self.observer
        topocentric = difference.at(t_now)
        return topocentric.distance().km
    


@app.route('/api/track', methods = ['GET', 'HEAD'])
def get_satellite_passes():
    if request.method == 'HEAD' or not request.args.get('lat'):
        return jsonify({
            "success":True,
            "message": "Ready!"
        }), 200
    try:
        lat = float(request.args.get('lat', 51.477928))
        lon = float(request.args.get('lon', 0.001545))
        sat_id = int(request.args.get('sat', 25544))

        engine = SatelliteEngine(norad_id = sat_id)
        satellite = engine.get_satellite()

        predicter = PassPredicter(satellite, lat,lon)
        passes = predicter.generate_passes()

        current_distance = predicter.get_nearest_distance()

        ts = load.timescale()
        t_now = ts.now()
        geocentric = satellite.at(t_now)
        subpoint = wgs84.subpoint(geocentric)

        current_lat = subpoint.latitude.degrees
        current_lon = subpoint.longitude.degrees

        raw_points = []
        for minutes in range (0, 120, 2):
            t_future = t_now + (minutes/1440)
            geo_future = satellite.at(t_future)
            sub_future = wgs84.subpoint(geo_future)
            raw_points.append([round(float(sub_future.latitude.degrees),5), round(float(sub_future.longitude.degrees), 5)])

        path_segments = []
        current_segment = []

        for i, point in enumerate(raw_points):
            if i == 0:
                current_segment.append(point)
                continue

            prev_point = raw_points[i-1]

            if abs(point[1]- prev_point[1]) > 180:
                path_segments.append(current_segment)
                current_segment = []
            current_segment.append(point)

        if current_segment:
            path_segments.append(current_segment)

        
        clean_name = str(satellite.name).split('\n')[0].strip()

        return jsonify({
            "success" :True,
            "satellite_name": clean_name or f"SAT {sat_id}",
            "norad_id": sat_id,
            "satellite_lat": round(current_lat, 5),
            "satellite_lon": round(current_lon,5),
            "pathPoints": path_segments,
            "observer": {"lat": round(lat, 5), "lon": round(lon, 5)},
            "trackingPasses":passes,
            "current_distance_km": round(current_distance,2)
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify ({"success": False, "error": str(e)}),400
    

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8080))
    app.run(host = '0.0.0.0', port = port, debug = False)