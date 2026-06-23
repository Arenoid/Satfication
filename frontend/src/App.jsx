import React, {useState} from 'react';
import SatelliteMap from './map';

export default function App(){
  const [satId, setSatId] = useState('20580');
  const [lat, setLat] = useState('27.26');
  const [lon, setLon] = useState('85.36');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null)
  const [trackingData, setTrackingData] = useState(null);

const handleTrack = async(e) =>{
  e.preventDefault();
  setLoading(true);
  setError(null);

try {
  const response = await fetch(
    `https://satfication.onrender.com/api/track?lat=${lat}&lon=${lon}&sat=${satId}`
  );
  const data = await response.json()

  if(data.success){
    setTrackingData(data);
  }else{
    setTrackingData(null);
    setError(data.error || "Failed to fetch data.");
  }
} catch (err){
  setTrackingData(null);
  setError("Unable to connect to tracking server!");
} finally{
  setLoading(false);
};
}

return (   
    <div className='font-sans text-gray-900'>
      <h1 className='text-2xl font-bold pb-2'>Satelite Tracker</h1>

      <form onSubmit={handleTrack} className='space-y-4 bg-gray-50 border rounded'>
        <div>
          <label className = "block text-sm font-semibold">Satellite ID:</label>
          <input
          type = "text"
          value = {satId}
          onChange={(e)=> setSatId(e.target.value)}
          className = "w-full border p-2 rounded bg-white"
          placeholder = "e.g. 25544"
          required
          />
        </div>

        <div className = "grid grid-cols-2 gap-4">
          <div>
            <label className='block text-sm font-semibold mb-1'>Observer Latitude</label>
            <input
            type = "number"
            step = "any"
            value = {lat}
            onChange = {(e) => setLat(e.target.value)}
            className = "w-full border p-2 rounded bg-white"
            required
            />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Observer Longitude</label>
          <input
          type = "number"
          step = "any"
          value = {lon}
          onChange = {(e) => setLon(e.target.value)}
          className = "w-full border p-2 rounded bg-white" 
          required   
          />
        </div>
      </div>

      <button
      type = "submit"
      disabled = {loading}
      className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
      >{loading ? "Calculationg overpass...": "TrackTarget"}</button>
    </form>

    <SatelliteMap 
    lat = {lat}
    lon = {lon}
    satLat = {trackingData?.satellite_lat}
    satLon= {trackingData?.satellite_lon}
    satName = {trackingData?.satellite_name}
    pathPoints={trackingData?.pathPoints}
    trackingPasses = {trackingData?.trackingPasses}
    />

    {error && (
      <div className='p-3 bg-red-100 border border-red-400 rounded mb-6'>
        <strong>Error:</strong>{error}
      </div>
    )}
    {trackingData && trackingData.success && Array.isArray(trackingData.trackingPasses) && (
      <div className='border rounded-lg overflow-hidden shadow-sm bg-white'>
        <div className='bg-gray-100 p-4 border-b'>
          <h2 className='text-xl font-bold text-gray-800'>{trackingData.satellite_name}</h2>
          <p className='text-sm text-gray-600 mt-0.5'>
            NORAD ID: #{trackingData.norad_id} | Observer: {trackingData.observer?.lat?? lat}°, {trackingData.observer?.lon ?? lon}°
          </p>
          </div>
          <div className='text-right'>
            <span className = "text-xs font-semibold text-gray-400 block uppercase tracking-wider">Live Distance</span>
            <span className = "font-mono text-base font-bold text-blue-600">{trackingData.current_distance_km}km</span>
            </div>
          <ul className='divide-y text-sm text-gray-700 divide-gray-100'>
            {trackingData.trackingPasses.map((pass,index) =>(
              <li key = {index} className='p-3 flex justify-between items-center hover:bg-gray-50'>
                <div className='flex justify-between items-center'>
                  <span className='font-bold text-gray-800'>Pass #{index + 1}</span>
                  <span className = "bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Closest Approach: {pass.closest_approach_km}km
                  </span>
                </div>

              <div className = "grid grid-cols-3 gap-2 font-mono text-xs text-center">
                <div className='bg-green-50 border border-green-100 p-2 rounded-lg text-green-700'>
                    <div className='font-sans font-bold uppercase text-[9px] text-green-500 mb-0.5'>Rise</div>
                    {pass.rise}
                </div>
                <div className = "bg-red-50 border border-red-100 p-2 rounded-lg text-red-700">
                  <div className='font-sans font-bold uppercase text-[9px] text-yellow-600 mb-0.5'>Peak Time</div>
                  {pass.peak_time}
                </div>
                <div className='bg-red-50 border border-red-100 p-2 rounded-lg text-red-700'>
                  <div className='font-sans font-bold uppercase text-[9px] text-red-500 mb-0.5'>Set</div>
                  {pass.set}
               </div>
              </div>
            </li> 
          ))}
        </ul>
      </div>
    )}
  </div>
)
}