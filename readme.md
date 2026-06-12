# Satellite Pass Tracker and Live Orbit Map

A real-time, satellite tracking application that predicts the orbital path of a entered satellite relative to the observers latitude and longitude

# Workings
- Fetches all the satellite data from CelesTrak API.
- Fetched data is then fed into the map using leaflet and also added indexing for searching for various satellites.
- Shows the path of satellites using leaflet.

## Backend
* **Python/Flask:**
* **Skyfield and SGP4:** 

# Demo
[Satficaiton](https://satfication.vercel.app/)

https://satfication.vercel.app/

## Frontend
* **React**
* **React-Leaftlet**
* **Tailwind CSS**
* **Vite**

# Installation

# Requirements
- Python 3.10+
- Node.js 18+

```bash
pip install flask flask cors skyfield numpy
python tracker.py
```

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

# Sources
- CelesTrak API
- Skyfield & SGP4
