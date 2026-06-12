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
    `http://127.0.0.1:5000/api/track?lat=${lat}&lon=${lon}&sat=${satId}`
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

      <button type = "submit" disabled = {loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
      {loading ? "Calculating overpasses...": "Track Target(Ignore the straight horizantal line :))"}
      </button>
    </form>

    <SatelliteMap 
    lat = {lat}
    lon = {lon}
    satLat = {trackingData?.satellite_lat}
    satLon= {trackingData?.satellite_lon}
    satName = {trackingData?.satellite_name}
    pathPoints={trackingData?.path_coordinates}
    />

    {error && (
      <div className='p-3 bg-red-100 border border-red-400 rounded mb-6'>
        <strong>Error:</strong>{error}
      </div>
    )}
    {trackingData && trackingData.success && Array.isArray(trackingData.passes) && (
      <div className = "border rounded-lg overflow-hidden shadow-sm bg-white">
        <div className='bg-gray-100 p-4 border-b'>
          <h2 className = 'text-xl font-bold text-gray-800'>{trackingData.satellite_name}</h2>
          <p className = "text-sm text-gray-600 mt-0.5">
            NORAD ID: #{trackingData.norad_id} | Observer: {trackingData.observer?.lat?? lat}°, {trackingData.observer?.lon ?? lon}°
          </p>
          </div>
          <ul className='divide-y'>
            {trackingData.passes.map((pass,index) =>(
             <li key = {index} className ="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <span className = {`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                pass.status === 'rise'? 'bg-green-100 text-green-800':
                pass.status === 'culminate' ? 'bg-yellow-100 text-yellow-800':
                'bg-red-100 text-red-800'
              }`}>
              {pass.status}
              </span>
              <span className='font-mono text-sm text-gray-700'>{pass.timestamp} UTC</span>
             </li> 
            ))}
          </ul>
        </div>
    )}
    </div>
  )
  }