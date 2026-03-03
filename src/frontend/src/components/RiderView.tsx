import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Navigation, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Driver } from "../backend.d";
import { useGetDrivers, useRequestRide } from "../hooks/useQueries";

// ─── Drop destinations ────────────────────────────────────────────────────────
const DROP_DESTINATIONS = [
  { label: "Ambala Cantt", hindi: "अंबाला छावनी", km: 8, icon: "🏙️" },
  { label: "Railway Station", hindi: "रेलवे स्टेशन", km: 5, icon: "🚉" },
  { label: "Bus Stand", hindi: "बस स्टैंड", km: 3, icon: "🚌" },
  { label: "Mullana", hindi: "मुल्लाना", km: 12, icon: "🌳" },
  { label: "Naggal", hindi: "नग्गल", km: 15, icon: "🏘️" },
] as const;

const BASE_FARE = 20;
const PER_KM_FARE = 12;

function calcFare(km: number): number {
  return BASE_FARE + km * PER_KM_FARE;
}

// ─── Tracking view ────────────────────────────────────────────────────────────
function TrackingView({
  rideId,
  drop,
  fare,
  onClose,
}: {
  rideId: bigint;
  drop: string;
  fare: number;
  onClose: () => void;
}) {
  return (
    <div className="p-4 animate-slide-in space-y-4">
      <div className="bg-green-mid/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <div className="text-3xl">✅</div>
        <div>
          <p className="font-display font-bold text-foreground">
            टैक्सी बुक हो गई! (Ride Booked!)
          </p>
          <p className="text-sm text-muted-foreground">
            सवारी नंबर #{rideId.toString()} — {drop}
          </p>
          <p className="text-sm font-semibold text-green-dark mt-0.5">
            किराया: ₹{fare} (नकद) | Fare: ₹{fare} (Cash)
          </p>
        </div>
      </div>

      {/* Cash notice */}
      <div className="bg-gold/20 border border-accent/40 rounded-lg px-4 py-2 flex items-center gap-2">
        <span className="text-xl">💵</span>
        <span className="font-semibold text-sm text-accent-foreground">
          भुगतान: नकद केवल | Payment: Cash Only
        </span>
      </div>

      {/* Map */}
      <div>
        <p className="font-display font-semibold mb-2 flex items-center gap-2">
          <Navigation size={16} className="text-primary" />
          लाइव ट्रैकिंग (Live Tracking)
        </p>
        <div className="map-wrapper relative">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=76.7,30.36,76.85,30.40&layer=mapnik"
            title="Ambala Map"
            loading="lazy"
          />
          {/* Pulsing taxi dot overlay */}
          <div
            className="absolute"
            style={{
              top: "45%",
              left: "55%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <div className="taxi-pulse" />
          </div>
          <div
            className="absolute bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow"
            style={{ top: "36%", left: "59%" }}
          >
            🚕 आपकी टैक्सी
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          (Simulated live location — Ambala area)
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full h-12 font-semibold"
        onClick={onClose}
      >
        नई बुकिंग करें (New Booking)
      </Button>
    </div>
  );
}

// ─── Driver Card ──────────────────────────────────────────────────────────────
function DriverCard({
  driver,
  index,
  selected,
  onSelect,
}: {
  driver: Driver;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border-2 p-3 flex items-center gap-3 cursor-pointer transition-all shadow-xs w-full text-left ${
        selected
          ? "border-primary bg-secondary"
          : "border-border bg-card hover:border-primary/40 hover:shadow-card"
      }`}
      data-ocid={`rider.driver_list.item.${index + 1}`}
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
        🧑‍✈️
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display font-bold text-foreground text-sm truncate">
            {driver.name}
          </p>
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              driver.isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>
        <p className="text-xs text-muted-foreground">{driver.carNumber}</p>
      </div>
      <a
        href={`tel:${driver.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-bold hover:bg-primary/90 transition-colors no-underline flex-shrink-0"
        data-ocid={`rider.driver_list.call_button.${index + 1}`}
      >
        <Phone size={13} />
        <span>कॉल</span>
      </a>
    </button>
  );
}

// ─── Main Rider View ──────────────────────────────────────────────────────────
export default function RiderView() {
  const { data: drivers = [], isLoading: driversLoading } = useGetDrivers();
  const requestRide = useRequestRide();

  const [pickupText, setPickupText] = useState("");
  const [pickupDetected, setPickupDetected] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<
    (typeof DROP_DESTINATIONS)[number] | null
  >(null);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [selectedDriverIdx, setSelectedDriverIdx] = useState<number | null>(
    null,
  );
  const [bookedRideId, setBookedRideId] = useState<bigint | null>(null);
  const [bookedDrop, setBookedDrop] = useState<string>("");
  const [bookedFare, setBookedFare] = useState<number>(0);

  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error("GPS उपलब्ध नहीं (GPS not available)");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const locStr = `📍 ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        setPickupText(locStr);
        setPickupDetected(true);
        setDetectingLocation(false);
        toast.success("जगह मिल गई! (Location detected!)");
      },
      () => {
        setDetectingLocation(false);
        setPickupDetected(false);
        toast.error("GPS काम नहीं किया। कृपया जगह टाइप करें।");
      },
      { timeout: 8000 },
    );
  }

  async function handleBookRide() {
    if (!pickupText.trim()) {
      toast.error("पहले अपनी जगह बताएं (Enter pickup location first)");
      return;
    }
    if (!selectedDrop) {
      toast.error("जाने की जगह चुनें (Select drop destination)");
      return;
    }
    if (!riderName.trim()) {
      toast.error("अपना नाम लिखें (Enter your name)");
      return;
    }
    if (!riderPhone.trim()) {
      toast.error("फ़ोन नंबर लिखें (Enter phone number)");
      return;
    }

    const fare = calcFare(selectedDrop.km);
    try {
      const rideId = await requestRide.mutateAsync({
        riderName: riderName.trim(),
        riderPhone: riderPhone.trim(),
        pickupLocation: pickupText.trim(),
        dropLocation: selectedDrop.label,
        estimatedFare: BigInt(fare),
      });
      setBookedRideId(rideId);
      setBookedDrop(`${selectedDrop.hindi} (${selectedDrop.label})`);
      setBookedFare(fare);
      toast.success("🚕 टैक्सी बुक हो गई! (Taxi Booked!)");
    } catch (_e) {
      toast.error("बुकिंग नहीं हुई। फिर कोशिश करें। (Booking failed, try again)");
    }
  }

  if (bookedRideId !== null) {
    return (
      <TrackingView
        rideId={bookedRideId}
        drop={bookedDrop}
        fare={bookedFare}
        onClose={() => {
          setBookedRideId(null);
          setBookedDrop("");
          setBookedFare(0);
          setSelectedDrop(null);
          setRiderName("");
          setRiderPhone("");
          setPickupText("");
          setPickupDetected(false);
          setSelectedDriverIdx(null);
        }}
      />
    );
  }

  const estimatedFare = selectedDrop ? calcFare(selectedDrop.km) : null;

  return (
    <div className="p-4 space-y-5 animate-slide-in">
      {/* ── Section: Pickup ─────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          कहाँ से? (Pickup)
        </h2>

        <Button
          className="w-full h-14 text-base font-bold bg-primary text-primary-foreground shadow-green hover:bg-primary/90 transition-all rounded-xl"
          onClick={detectLocation}
          disabled={detectingLocation}
          data-ocid="rider.detect_location_button"
        >
          {detectingLocation ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              जगह ढूंढ रहे हैं... (Detecting...)
            </>
          ) : (
            <>
              <span className="mr-2 text-xl">📡</span>
              अपनी जगह पता करें (Detect My Location)
            </>
          )}
        </Button>

        {pickupDetected ? (
          <div className="bg-secondary rounded-xl px-4 py-3 border border-primary/30 flex items-center gap-2">
            <div className="pulse-dot flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground break-all">
              {pickupText}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">
              या यहाँ लिखें (or type here):
            </Label>
            <Input
              placeholder="अपनी जगह लिखें... e.g. Ambala Village, Near School"
              value={pickupText}
              onChange={(e) => setPickupText(e.target.value)}
              className="h-12 text-base rounded-xl"
              data-ocid="rider.pickup_input"
            />
          </div>
        )}
      </section>

      {/* ── Section: Drop ───────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          🗺️ कहाँ जाना है? (Where to go?)
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {DROP_DESTINATIONS.map((dest, idx) => {
            const fare = calcFare(dest.km);
            const isSelected = selectedDrop?.label === dest.label;
            return (
              <button
                type="button"
                key={dest.label}
                onClick={() => setSelectedDrop(dest)}
                className={`drop-btn rounded-xl p-3 text-left w-full ${isSelected ? "selected" : "bg-card"}`}
                data-ocid={`rider.drop.button.${idx + 1}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{dest.icon}</span>
                  <div>
                    <p className="font-display font-bold text-sm leading-tight">
                      {dest.hindi}
                    </p>
                    <p
                      className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                    >
                      {dest.label}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-xs font-bold mt-1 ${isSelected ? "text-primary-foreground" : "text-accent-foreground"}`}
                >
                  {dest.km} km — ₹{fare}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Fare Display ────────────────────────────────────────────────── */}
      {estimatedFare !== null && (
        <div className="bg-gold/20 border-2 border-accent/50 rounded-xl px-4 py-3 flex items-center justify-between gap-2 animate-fade-in">
          <div>
            <p className="font-display font-bold text-lg text-foreground">
              ₹{estimatedFare}
            </p>
            <p className="text-xs text-muted-foreground">
              अनुमानित किराया (Estimated Fare)
            </p>
          </div>
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
            💵 नकद | Cash Only
          </Badge>
        </div>
      )}

      {/* ── Section: Rider Details ───────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          👤 आपकी जानकारी (Your Details)
        </h2>
        <div>
          <Label
            htmlFor="rider-name"
            className="text-sm font-semibold mb-1 block"
          >
            नाम (Name) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rider-name"
            placeholder="अपना नाम लिखें..."
            value={riderName}
            onChange={(e) => setRiderName(e.target.value)}
            className="h-12 text-base rounded-xl"
            data-ocid="rider.name_input"
          />
        </div>
        <div>
          <Label
            htmlFor="rider-phone"
            className="text-sm font-semibold mb-1 block"
          >
            फ़ोन नंबर (Phone) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rider-phone"
            placeholder="जैसे: 9876543210"
            type="tel"
            value={riderPhone}
            onChange={(e) => setRiderPhone(e.target.value)}
            className="h-12 text-base rounded-xl"
            inputMode="numeric"
            data-ocid="rider.phone_input"
          />
        </div>
      </section>

      {/* ── Book Button ──────────────────────────────────────────────────── */}
      <Button
        className="w-full h-16 text-xl font-display font-bold bg-primary text-primary-foreground shadow-green hover:bg-primary/90 rounded-2xl tracking-wide"
        onClick={handleBookRide}
        disabled={requestRide.isPending}
        data-ocid="rider.book_button"
      >
        {requestRide.isPending ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            बुक हो रहा है...
          </>
        ) : (
          <>🚕 टैक्सी बुक करें (Book Taxi)</>
        )}
      </Button>

      {/* ── Drivers List ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          🧑‍✈️ उपलब्ध ड्राइवर (Available Drivers)
          <Badge variant="secondary" className="text-xs">
            {drivers.filter((d) => d.isOnline).length} ऑनलाइन
          </Badge>
        </h2>

        {driversLoading ? (
          <div
            className="flex items-center justify-center py-8 gap-2 text-muted-foreground"
            data-ocid="rider.driver_list.loading_state"
          >
            <Loader2 className="animate-spin h-5 w-5" />
            <span>ड्राइवर लोड हो रहे हैं...</span>
          </div>
        ) : drivers.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="rider.driver_list.empty_state"
          >
            <p className="text-4xl mb-2">🚗</p>
            <p>कोई ड्राइवर उपलब्ध नहीं (No drivers available)</p>
          </div>
        ) : (
          <div className="space-y-2" data-ocid="rider.driver_list">
            {drivers.map((driver, idx) => (
              <DriverCard
                key={driver.id.toString()}
                driver={driver}
                index={idx}
                selected={selectedDriverIdx === idx}
                onSelect={() =>
                  setSelectedDriverIdx(selectedDriverIdx === idx ? null : idx)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
