import React from "react";
import {MapContainer, TileLayer, CircleMarker, useMap, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapRecenter({center}){
    const map = useMap();
    if (center) {
        map.setView(center, map.getZoom());
    }
    return null
}

export default function SatelliteMap({lat,lon}){
    const parsedLat = parseFloat(lat) || 27.26;
    const parsedLon = parseFloat(lon) || 85.36;
    const coordinates = [parsedLat, parsedLon];



return (
    <div className = "border rounded-xl overflow-hiddn shadow-md bg-white min-h-[400px] flex flex-col">
        <div className="bg-slate-800 text-white px-4 py-3 font-semibold">
            <span>Spatial Observation Grid</span>
                <span className="text-xs text-slate-400">Lat:{parsedLat}° | Lon: {parsedLon}°</span>
        </div>
        <div className="flex-grow w-full h-[75vh] z-0">
            <MapContainer
            center = {coordinates}
            zoom = {10}
            style = {{height:'100%', width: '100%'}}
            >
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"/>
                <MapRecenter center = {coordinates}/>
                <CircleMarker
                    center = {coordinates}
                    radius = {8}
                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 2 }}
                    >
                        <Popup>
                            <div className="text-center font-sans">
                                <p className = "font-bold">Ground Station Node</p>
                                <p className = "text-xs text-gray-500"> Waiting for pass window...</p>
                            </div>
                        </Popup>
                </CircleMarker>
            </MapContainer> 
        </div>
       </div>
    );
}