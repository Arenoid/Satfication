from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime,timedelta, timezone
from skyfield.api import load, EarthSatellite, wgs84
import os

app = Flask(__name__)
CORS(app)

ts = load.timescale()
def get_satellite_object(sat_id, minutes_offset=0):
    try:
        url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={sat_id}&FORMAT=TLE"
        responses = requests.get(url, timeout = 5)

        if responses.status_code !=200 or not responses.text.strip():
            return None,  "Invalid Satellite ID" 
        
        lines = responses.text.strip().split('\n')
        if len(lines) <3:
            return None,"Could not find a valid TLE"
        

        sat_name = lines[0].strip()
        line1 = lines[1].strip()
        line2 = lines[2].strip()

        satellite = EarthSatellite(line1, line2, sat_name, ts)

        return satellite, None
    
    except Exception as e:
        return None, str(e)
    
def propagate_position(satellite, minutes_offset = 0):
    target_time = datetime.now(timezone.utc) + timedelta(minutes = minutes_offset)
    skyfield_time = ts.from_datetime(target_time)

    geocentric = satellite.at(skyfield_time)
    subpoint = wgs84.subpoint(geocentric)
    return round(subpoint.latitude.degrees, 4), round(subpoint.longitude.degrees,4)

@app.route('/api/track', methods = ['GET'])
def track_satellite():
    sat_id = request.args.get('sat', '25544')
    user_lat = request.args.get('lat', '27.26')
    user_lon = request.args.get('lon', '85.36')

    satellite, error = get_satellite_object(sat_id)
    if error:
        return jsonify({"success":False, "error": error}), 400

    current_lat, current_lon = propagate_position(satellite,0)

    path_coordinates = []
    for m in range (0,93,3):
        lat, lon = propagate_position(satellite,m)
        path_coordinates.append([lat, lon])


    return jsonify({
        "success":True,
        "satellite_name": satellite.name,
        "norad_id":int(sat_id) if sat_id.isdigit() else 25544,
        "satellite_lat":current_lat,
        "satellite_lon":current_lon,
        "path_coordinates":
            path_coordinates,
            
        "observer":{"lat": float(user_lat), "lon": float(user_lon)}
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host = '0.0.0.0', port = port, debug = False)