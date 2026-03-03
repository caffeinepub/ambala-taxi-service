import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Loader2, Navigation, Phone, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Ride, RideStatus } from "../backend.d";
import {
  useAcceptRide,
  useGetDrivers,
  useGetPendingRides,
  useGetRidesForDriver,
  useToggleDriverOnline,
  useUpdateRideStatus,
} from "../hooks/useQueries";

// ─── Ride Request Card ────────────────────────────────────────────────────────
function RideRequestCard({
  ride,
  index,
  driverId,
}: {
  ride: Ride;
  index: number;
  driverId: bigint;
}) {
  const acceptRide = useAcceptRide();
  const updateStatus = useUpdateRideStatus();

  async function handleAccept() {
    try {
      await acceptRide.mutateAsync({ rideId: ride.id, driverId });
      toast.success(`✅ सवारी स्वीकार की! (Ride #${ride.id} accepted)`);
    } catch {
      toast.error("सवारी स्वीकार नहीं हुई। (Failed to accept ride)");
    }
  }

  async function handleReject() {
    try {
      await updateStatus.mutateAsync({
        rideId: ride.id,
        status: RideStatus.Cancelled,
      });
      toast.success("❌ सवारी रद्द की। (Ride cancelled)");
    } catch {
      toast.error("रद्द नहीं हुआ। (Failed to cancel ride)");
    }
  }

  const isBusy = acceptRide.isPending || updateStatus.isPending;

  return (
    <div
      className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3 animate-slide-in"
      data-ocid={`driver.ride_request.item.${index + 1}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-base text-foreground">
            {ride.riderName}
          </p>
          <a
            href={`tel:${ride.riderPhone}`}
            className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            <Phone size={13} />
            {ride.riderPhone}
          </a>
        </div>
        <Badge className="status-pending text-xs px-2 py-0.5 font-bold flex-shrink-0">
          नई सवारी
        </Badge>
      </div>

      {/* Route info */}
      <div className="bg-secondary rounded-xl p-3 space-y-1 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">📍</span>
          <div>
            <p className="text-xs text-muted-foreground">पिकअप (Pickup)</p>
            <p className="font-semibold text-foreground break-all">
              {ride.pickupLocation}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">🏁</span>
          <div>
            <p className="text-xs text-muted-foreground">मंज़िल (Drop)</p>
            <p className="font-semibold text-foreground">{ride.dropLocation}</p>
          </div>
        </div>
      </div>

      {/* Fare */}
      <div className="flex items-center justify-between">
        <div className="bg-gold/20 rounded-lg px-3 py-1.5">
          <span className="font-display font-bold text-lg text-accent-foreground">
            ₹{ride.estimatedFare.toString()}
          </span>
          <span className="text-xs text-muted-foreground ml-1">नकद</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ID #{ride.id.toString()}
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-12 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          onClick={handleAccept}
          disabled={isBusy}
          data-ocid={`driver.accept_button.${index + 1}`}
        >
          {acceptRide.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle size={18} className="mr-1.5" />
              स्वीकार करें
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          className="h-12 font-bold text-base rounded-xl"
          onClick={handleReject}
          disabled={isBusy}
          data-ocid={`driver.reject_button.${index + 1}`}
        >
          {updateStatus.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <XCircle size={18} className="mr-1.5" />
              मना करें
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Active Ride Card ─────────────────────────────────────────────────────────
function ActiveRideCard({ ride }: { ride: Ride }) {
  const updateStatus = useUpdateRideStatus();

  async function handleComplete() {
    try {
      await updateStatus.mutateAsync({
        rideId: ride.id,
        status: RideStatus.Completed,
      });
      toast.success("🎉 यात्रा पूरी हुई! (Ride completed!)");
    } catch {
      toast.error("पूरा नहीं हुआ। (Failed to complete ride)");
    }
  }

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.pickupLocation)}`;

  return (
    <div className="bg-card rounded-2xl border-2 border-primary shadow-card-hover p-4 space-y-4 animate-slide-in">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          ✓
        </div>
        <div>
          <p className="font-display font-bold text-foreground">
            {ride.riderName}
          </p>
          <p className="text-xs text-muted-foreground">
            स्वीकृत सवारी | Accepted Ride #{ride.id.toString()}
          </p>
        </div>
        <Badge className="status-accepted ml-auto text-xs">Accepted</Badge>
      </div>

      <div className="bg-secondary rounded-xl p-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span>📍</span>
          <div>
            <p className="text-xs text-muted-foreground">Pickup</p>
            <p className="font-semibold break-all">{ride.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>🏁</span>
          <div>
            <p className="text-xs text-muted-foreground">Drop</p>
            <p className="font-semibold">{ride.dropLocation}</p>
          </div>
        </div>
      </div>

      <div className="bg-gold/20 rounded-lg px-4 py-2 text-center">
        <span className="font-display font-bold text-xl text-accent-foreground">
          ₹{ride.estimatedFare.toString()}
        </span>
        <span className="text-xs text-muted-foreground ml-1">नकद | Cash</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-12 bg-secondary text-secondary-foreground border border-border rounded-xl font-bold text-sm hover:bg-secondary/80 transition-colors"
          data-ocid="driver.navigate_button"
        >
          <Navigation size={16} />
          नेविगेट करें
        </a>
        <a
          href={`tel:${ride.riderPhone}`}
          className="flex items-center justify-center gap-1.5 h-12 bg-primary/10 text-primary border border-primary/30 rounded-xl font-bold text-sm hover:bg-primary/20 transition-colors"
          data-ocid="driver.call_rider_button"
        >
          <Phone size={16} />
          कॉल करें
        </a>
      </div>

      <Button
        className="w-full h-14 text-base font-display font-bold bg-primary text-primary-foreground rounded-xl shadow-green hover:bg-primary/90"
        onClick={handleComplete}
        disabled={updateStatus.isPending}
        data-ocid="driver.complete_button"
      >
        {updateStatus.isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <>🏁 यात्रा पूरी (Complete Ride)</>
        )}
      </Button>
    </div>
  );
}

// ─── Main Driver View ─────────────────────────────────────────────────────────
export default function DriverView() {
  const { data: allDrivers = [], isLoading: driversLoading } = useGetDrivers();
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const toggleOnline = useToggleDriverOnline();

  const driverId = selectedDriverId ? BigInt(selectedDriverId) : null;
  const currentDriver = driverId
    ? (allDrivers.find((d) => d.id === driverId) ?? null)
    : null;

  const { data: pendingRides = [], isLoading: ridesLoading } =
    useGetPendingRides();
  const { data: myRides = [] } = useGetRidesForDriver(driverId);

  const acceptedRide =
    myRides.find((r) => r.status === RideStatus.Accepted) ?? null;

  async function handleToggleOnline() {
    if (!driverId) {
      toast.error("पहले ड्राइवर चुनें (Select driver first)");
      return;
    }
    try {
      await toggleOnline.mutateAsync(driverId);
      toast.success(
        currentDriver?.isOnline
          ? "ऑफलाइन हो गए (Gone offline)"
          : "ऑनलाइन हो गए! (Now online!)",
      );
    } catch {
      toast.error("अपडेट नहीं हुआ (Update failed)");
    }
  }

  return (
    <div className="p-4 space-y-5 animate-slide-in">
      {/* ── Driver Selector ──────────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          🚗 मैं कौन हूँ? (Select Your Profile)
        </h2>
        {driversLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">लोड हो रहा है...</span>
          </div>
        ) : (
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger
              className="h-12 text-base rounded-xl"
              data-ocid="driver.select"
            >
              <SelectValue placeholder="ड्राइवर चुनें (Select Driver)" />
            </SelectTrigger>
            <SelectContent>
              {allDrivers.map((d) => (
                <SelectItem key={d.id.toString()} value={d.id.toString()}>
                  <span className="font-semibold">{d.name}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    — {d.carNumber}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {currentDriver && (
          <div className="bg-secondary rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold">{currentDriver.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentDriver.carNumber} · {currentDriver.phone}
              </p>
            </div>
            <Badge
              className={
                currentDriver.isOnline
                  ? "status-completed"
                  : "bg-muted text-muted-foreground"
              }
            >
              {currentDriver.isOnline ? "🟢 ऑनलाइन" : "⚫ ऑफलाइन"}
            </Badge>
          </div>
        )}
      </section>

      {/* ── Online Toggle ────────────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border shadow-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-lg">
              {currentDriver?.isOnline ? "🟢 ऑनलाइन" : "⚫ ऑफलाइन"}
            </p>
            <p className="text-sm text-muted-foreground">Online / Offline</p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="online-toggle" className="text-sm font-semibold">
              {currentDriver?.isOnline ? "ON" : "OFF"}
            </Label>
            <Switch
              id="online-toggle"
              checked={currentDriver?.isOnline ?? false}
              onCheckedChange={handleToggleOnline}
              disabled={!driverId || toggleOnline.isPending}
              className="scale-125"
              data-ocid="driver.online_toggle"
            />
          </div>
        </div>
      </section>

      {/* ── Active Ride ───────────────────────────────────────────────────── */}
      {acceptedRide && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            🛣️ चालू सवारी (Current Ride)
          </h2>
          <ActiveRideCard ride={acceptedRide} />
        </section>
      )}

      {/* ── Pending Requests ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          🔔 नई सवारी (New Ride Requests)
          {pendingRides.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs font-bold">
              {pendingRides.length}
            </Badge>
          )}
        </h2>

        {!driverId && (
          <div className="bg-muted/50 rounded-xl p-4 text-center text-muted-foreground text-sm">
            पहले ऊपर से अपना नाम चुनें।
            <br />
            (Select your driver profile above first)
          </div>
        )}

        {driverId && ridesLoading && (
          <div
            className="flex items-center justify-center py-8 gap-2 text-muted-foreground"
            data-ocid="driver.rides.loading_state"
          >
            <Loader2 className="animate-spin h-5 w-5" />
            <span>लोड हो रहा है...</span>
          </div>
        )}

        {driverId &&
          !ridesLoading &&
          pendingRides.length === 0 &&
          !acceptedRide && (
            <div
              className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-border"
              data-ocid="driver.rides.empty_state"
            >
              <p className="text-4xl mb-2">😴</p>
              <p className="font-semibold">कोई नई सवारी नहीं</p>
              <p className="text-sm">(No new ride requests)</p>
            </div>
          )}

        {driverId &&
          pendingRides.map((ride, idx) => (
            <RideRequestCard
              key={ride.id.toString()}
              ride={ride}
              index={idx}
              driverId={driverId}
            />
          ))}
      </section>
    </div>
  );
}
