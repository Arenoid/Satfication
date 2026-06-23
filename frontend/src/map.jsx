import React, { useEffect } from "react";
import {MapContainer, TileLayer, CircleMarker, useMap, Popup, Polyline} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'

function MapRecenter({lat, lon}){
    const map = useMap();

    useEffect(() =>{
        if(map && !isNaN(lat) && !isNaN(lon)){
            try{
                map.setView([lat, lon], map.getZoom());

                const timer = setTimeout(() => {
                    if(map && map.getContainer()){
                        map.invalidateSize();
                    }
                },100);
                return () => clearTimeout(timer);
            } catch(error){
                console.error("Map not working:", error)
            }
        }
    },[map, lat, lon])
    return null
} 
export default function SatelliteMap({lat, lon, satLat, satLon, satName, pathPoints, trackingPasses}){
    const parsedLat = isNaN(parseFloat(lat)) ? 51.477928 : parseFloat(lat);
    const parsedLon = isNaN(parseFloat(lon)) ? -0.001545: parseFloat(lon);
    const observerCoordinates = [parsedLat,parsedLon];

    const parsedSatLat = parseFloat(satLat);
    const parsedSatLon = parseFloat(satLon);
    const hasValidSatCoords = !isNaN(parsedSatLat) && !isNaN(parsedSatLon);

    const MAX_RADIUS_KM = 50000;
    const getApproachColor = (distance) =>{
        if(!distance || distance > MAX_RADIUS_KM) return null;
        if(distance <=800) return {color: "green", fill:'green', label: 'Close Pass'}
        if(distance <=1800) return {color: "yellow", fill:'yellow', label: 'Mid Pass'}
        return {color: "red", fill:'red', label: 'Far Pass'}
    }


    const renderPathSegments = () => {
        if (!Array.isArray(pathPoints) || pathPoints.length === 0) return []

        if (Array.isArray(pathPoints[0]) && Array.isArray(pathPoints[0][0])) {
            return pathPoints.map(segment =>
                segment
                    .filter(point => Array.isArray(point) && point.length >= 2 && !isNaN(parseFloat(point[0])) && !isNaN(parseFloat(point[1])))
                    .map(point => [parseFloat(point[0]), parseFloat(point[1])])
            ).filter(segment => segment.length > 0)
        }

        const flatPoints = pathPoints
            .filter(point => Array.isArray(point) && point.length >= 2 && !isNaN(parseFloat(point[0])) && !isNaN(parseFloat(point[1])))
            .map(point => [parseFloat(point[0]), parseFloat(point[1])])

        return flatPoints.length > 0 ? [flatPoints] : []
    }

    const validSegment = renderPathSegments();

    return(
        <div className = "border rounded-xl overflow-hidden shadow-md bg-white flex flex-col h-[75vh]">
            <div className = "bg-slate-800 text-white px-4 py-3 font-semibold flex justify-between items-center">
                <span>Live Orbit:{satName || "No Target"}</span>
                <span className="text-xs text-slate-400">Observer Lat:{parsedLat}° | Lon: {parsedLon}°</span>
            </div>
            <div className="flex-grow w-full h-[75vh] z-0">
                <MapContainer
                center = {[51.477928,-0.0015450]}
                zoom = {3}
                minZoom={2}
                style = {{height:'100%', width: '100%'}}
                maxBounds={[
                    [-90, -180],
                    [90,180]
                ]}
                maxBoundsViscosity={1}
                >
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                />
                <MapRecenter lat = {parsedLat} lon = {parsedLon}/>
                <CircleMarker
                center = {observerCoordinates}
                radius = {8}
                pathOptions = {{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 2 }}
                >
                    <Popup>
                        <div className = "text-center font-sans">
                            <p className = "font-bold">Ground Node</p>
                            <p className="text-xs text-gray-500">Watching the skies..</p>
                        </div>
                    </Popup>
                    </CircleMarker>
                
                {hasValidSatCoords && (
                    <CircleMarker
                    center = {[parsedSatLat, parsedSatLon]}
                    radius = {10}
                    pathOptions={{color: 'red', fillColor: '#ef4444', fillOpacity: 0.9, weight:2}}  
                    >

                        <Popup>
                            <div className="text-center font-sans">
                            <p className="font-bold text-red-600">{satName || "Satellite"}</p>
                            <p className="text-xs text-gray-500">Lat: {parsedSatLat}° | Lon : {parsedSatLon}°</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                )}

           
  

            {(() => {
                const allPoints = validSegment.flat(1)
                if (allPoints.length === 0) return null

                let calculatedClosestPoint = allPoints[0]
                let minDistanceSq = Infinity

                allPoints.forEach(([pLat, pLon]) => {
                    const dLat = pLat - parsedLat
                    const dLon = (pLon - parsedLon)* Math.cos((parsedLat*Math.PI)/180)
                    const distSq = dLat * dLat + dLon * dLon

                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq
                        calculatedClosestPoint = [pLat, pLon]
                    }
                })

                if (Array.isArray(trackingPasses) && trackingPasses.length > 0) {
                    return trackingPasses.map((pass, index) => {
                        const dist = parseFloat(pass?.closest_approach_km)
                        const config = getApproachColor(dist)
                        const activeConfig = config || { color: "purple", fill: "purple", label: "Global Pass" }

                        return (
                            <CircleMarker
                                key={`intercept-pass-${index}-${calculatedClosestPoint[0]}-${calculatedClosestPoint[1]}`}
                                center={calculatedClosestPoint}
                                radius={10}
                                pathOptions={{ color: activeConfig.color, fillColor: activeConfig.fill, fillOpacity: 0.9, weight: 2 }}
                            >
                                <Popup>
                                    <div className="text-center font-sans text-xs">
                                    <p className="font-bold text-gray-800">Pass #{index + 1} Intercept</p>
                                    <p className="font-semibold mt-0.5" style={{ color: activeConfig.color }}>{activeConfig.label}</p>
                                    <p className="text-gray-600 font-mono mt-1 font-bold">
                                            Range: {isNaN(dist) ? "N/A" : `${dist.toFixed(1)} km`}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Peak Time: {pass?.peak_time || "Unknown"}</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        )
                    })
                }

                return (
                    <CircleMarker
                        key={`auto-intercept-${calculatedClosestPoint[0]}-${calculatedClosestPoint[1]}`}
                        center={calculatedClosestPoint}
                        radius={10}
                        pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.9, weight: 2 }}
                    >
                        <Popup>
                            <div className="text-center font-sans text-xs">
                            <p className="font-bold text-green-600">Calculated Intercept Point</p>
                            <p className="text-gray-500 font-mono text-[11px] mt-1">
                            Lat: {calculatedClosestPoint[0].toFixed(3)}° | Lon:{calculatedClosestPoint[1].toFixed(3)}°
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5"></p>
                            </div>
                        </Popup>
                    </CircleMarker>
                )
            })()}
                {validSegment.map((segment, index)=>
                    <Polyline
                        key={index}
                        positions={segment}
                        pathOptions={{color: "#dc2626", weight:3, opacity:0.6, dashArray:`10,10`}}
                        />
                )}
                </MapContainer>
            </div>
        </div>
    )
};