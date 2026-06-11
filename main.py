from flask import Flask, jsonify, request
from flask_cors import CORS
app = Flask(__name__)

CORS(app)

@app.route('/api/track', methods = ['GET'])
def track_satellite():
    return jsonify({
        "success":True,
        "satellite_name": "ISS",
        "satellite_lat":27.26,
        "satellite_lon":85.36,
        "path_coordinates":[
            [27.86,85.36],
            [28.00,86.00],
            [29.10,87.20]
            ]
    })

if __name__ == '__main__':
    app.run(debug=True, port = 5000)