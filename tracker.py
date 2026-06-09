import time
import argparse
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from skyfield.api import load,wgs84

app = Flask(__name__)
CORS(app)

class SatelliteEngine:
    def __init__(self, norad_id: int, cache_duration: int = 86400):
        self.norad_id = norad_id
        self.cache_duration = cache_duration
        self.filename = Path(f"sat_{norad_id}.tle")

    def get_satellite(self):
        if self.filename.exists() and (time.time() - self.filename.stat().st_mtime< self.cache_duration):
            satellites = load.tle_file(str(self.filename))

        else:
            url = f'https://celestrak.org/NORAD/elements/gp.php?CATNR={self.norad_id}&FORMAT=TLE'
            satellites = load.tle_file(url, reload=True, filename=str(self.filename))

        if not satellites:
            raise ValueError(f"Failed to parse TLE data for: {self.norad_id}")
        
        return satellites[0]
    


class PassPredicter:
    def __init__(self, satellite, lat:float, lon: float, horizon_degrees: float = 10.0):
        self.satellite = satellite
        self.observer = wgs84.latlon(lat,lon)
        self.horizon = horizon_degrees
        self.ts = load.timescale()


    def generate_passes(self):
        t0 = self.ts.now()
        t1 = self.ts.utc(t0.utc_datetime().year, t0.utc_datetime().month, t0.utc_datetime().day + 1)
        times, events = self.satellite.find_events(self.observer, t0, t1, altitude_degrees = self.horizon)

        pass_list = []
        for ti, event in zip(times, events):
            event_name = ('rise', 'culminate', 'set')[event]
            pass_list.append({
                "timestamp" : ti.utc_strftime('%Y-%m-%d %H:%M:%S'),
                "status":event_name
            })
        return pass_list
    


@app.route('/api/track', methods = ['GET'])
def get_satellite_passes():
    try:
        lat = float(request.args.get('lat', 27.26))
        lon = float(request.args.get('lon', 85.36))
        sat_id = int(request.args.get('sat', 25544))

        engine = SatelliteEngine(norad_id = sat_id)
        satellite = engine.get_satellite()

        predicter = PassPredicter(satellite, lat,lon)
        passes = predicter.generate_passes()

        return jsonify({
            "success" :True,
            "satellite_name": satellite.name.strip(),
            "norad_id": sat_id,
            "observer": {"lat": lat, "lon": lon},
            "passes":passes
        })
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400
    

if __name__ == "__main__":
    app.run(debug=True, port = 5000)