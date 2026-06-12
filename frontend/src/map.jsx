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
} 
export default function SatelliteMap({lat, lon, satLat, satLon, satName, pathPoints}){
    const parsedLat = isNaN(parseFloat(lat)) ? 51.477928 : parseFloat(lat);
    const parsedLon = isNaN(parseFloat(lon)) ? -0.001545: parseFloat(lon);
    const observerCoordinates = [parsedLat,parsedLon];

    const parsedSatLat = parseFloat(satLat);
    const parsedSatLon = parseFloat(satLon);
    const hasValidSatCoords = !isNaN(parsedSatLat) && !isNaN(parsedSatLon);

    const validPathPoints = Array.isArray(pathPoints)
    ? pathPoints.filter(point =>
        Array.isArray(point)&&
        point.length >= 2 &&
        !isNaN(parseFloat(point[0]))&&
        !isNaN(parseFloat(point[1]))
    ).map(point => [parseFloat(point[0]), parseFloat(point[1])])
    : [];
    

    return(
        <div className = "border rounded-xl overflow-hidden shadow-md bg-white flex flex-col">
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
  
  
  
                {pathPoints && pathPoints.length>0 && (
                    <Polyline
                        positions={pathPoints}
                        pathOptions={{color: "#dc2626", weight:3, opacity:0.6, dashArray:`10,10`}}
                        />
                )}
                </MapContainer>
            </div>
        </div>
    )
};