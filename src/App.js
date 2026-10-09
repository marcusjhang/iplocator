import "leaflet/dist/leaflet.css"
import icon from "./icon"
import arrow from "./images/icon-arrow.svg"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useEffect, useState } from "react"

const IPIFY_URL = process.env.REACT_APP_IPIFY_URL || "https://geo.ipify.org"

function App() {
  const [address, setAddress] = useState(null)
  const [ipAddress, setIpAddress] = useState("")

  useEffect(() => {
    try {
      const getInitialData = async () => {
        const res = await fetch(`${IPIFY_URL}/api/v2/country,city?apiKey=${process.env.REACT_APP_API_KEY}&ipAddress=192.212.174.101`)
        const data = await res.json()
        setAddress(data)
      }

      getInitialData()
    
    } 
    catch(error) {
      console.trace(error)
    }
  }, [])

  const handleInputChange = (event) => {
    setIpAddress(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault() //prevents website from reloading, which will call useEffect again
    try {
      const res = await fetch(`${IPIFY_URL}/api/v2/country,city?apiKey=${process.env.REACT_APP_API_KEY}&ipAddress=${ipAddress}`);
      const data = await res.json();
      setAddress(data);
    } catch (error) {
      console.trace(error)
    }
  };


  return (
    <div className="w-100vw h-screen bg-gray-700">
      <article className="relative p-8">
        <h1 className="text-3xl text-center text-white font-bold mb-8">IP Locator</h1>
        <form className="flex justify-center max-w-2xl mx-auto" onSubmit={handleSubmit}>
          <input type="text" name="ipaddress" id="ipaddress" value={ipAddress} onChange={handleInputChange} placeholder="Search for any IP Adress or domain" required className="py-2 px-4 rounded-l-lg w-full"/>
          <button type="submit" className="bg-black py-4 px-4 hover:opacity-60 rounded-r-lg">
            <img src={arrow} alt=""/>
          </button>
        </form>
      </article>
      {address && //asynchronus API call thus need to wait till address is not null before loading, no key needed because the article isnt dynamically rendered
          <article className="bg-white rounded-lg shadow p-8 mx-auto relative grid grid-cols-4 max-w-6xl mb-8">
            <div className="border-r border-slate-400 px-4">
              <h2 className="font-bold text-slate-600">IP ADDRESS</h2>
              <p className="font-bold">{address.ip}</p>
            </div>
            <div className="border-r border-slate-400 px-4">
              <h2 className="font-bold text-slate-600">LOCATION</h2>
              <p className="font-bold">{address.location.country}</p>
            </div>
            <div className="border-r border-slate-400 px-4">
              <h2 className="font-bold text-slate-600">TIMEZONE</h2>
              <p className="font-bold">{address.location.timezone}</p>
            </div>
            <div className="px-4">
              <h2 className="font-bold text-slate-600">ISP</h2>
              <p className="font-bold">{address.isp}</p>
            </div>
          </article>
      }
      {address && 
          <MapContainer 
              key={address.ip} //specifically for dynamically rendered elements, meaning the entire container changes, not just values within it
              center={[address.location.lat, address.location.lng]} 
              zoom={13} 
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker icon={icon} position={[address.location.lat, address.location.lng]}>
                <Popup>
                  {address.isp}
                </Popup>
              </Marker>
          </MapContainer>
        }
    </div>
  );
}

export default App;
