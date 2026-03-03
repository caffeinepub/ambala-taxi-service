import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Driver, type Ride, RideStatus } from "../backend.d";
import {
  useAddDriver,
  useDeleteDriver,
  useGetDrivers,
  useGetRides,
  useSeedSampleDrivers,
  useToggleDriverOnline,
  useUpdateDriver,
} from "../hooks/useQueries";

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RideStatus }) {
  const cls = {
    [RideStatus.Pending]: "status-pending",
    [RideStatus.Accepted]: "status-accepted",
    [RideStatus.Completed]: "status-completed",
    [RideStatus.Cancelled]: "status-cancelled",
  }[status];
  const label = {
    [RideStatus.Pending]: "Pending",
    [RideStatus.Accepted]: "Accepted",
    [RideStatus.Completed]: "Completed",
    [RideStatus.Cancelled]: "Cancelled",
  }[status];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border shadow-card ${
        accent
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-foreground"
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div
        className={`font-display font-bold text-2xl ${accent ? "text-primary-foreground" : "text-foreground"}`}
      >
        {value}
      </div>
      <div
        className={`text-xs font-semibold ${accent ? "text-primary-foreground/80" : "text-foreground"}`}
      >
        {label}
      </div>
      {sub && (
        <div
          className={`text-xs mt-0.5 ${accent ? "text-primary-foreground/60" : "text-muted-foreground"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Driver Form ────────────────────────────────────────────────────────────────
interface DriverFormData {
  name: string;
  carNumber: string;
  phone: string;
}

function DriverFormDialog({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Driver;
}) {
  const addDriver = useAddDriver();
  const updateDriver = useUpdateDriver();
  const [form, setForm] = useState<DriverFormData>({
    name: existing?.name ?? "",
    carNumber: existing?.carNumber ?? "",
    phone: existing?.phone ?? "",
  });

  const isEdit = !!existing;
  const isBusy = addDriver.isPending || updateDriver.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.carNumber.trim() || !form.phone.trim()) {
      toast.error("सभी जानकारी भरें (Fill all fields)");
      return;
    }
    try {
      if (isEdit && existing) {
        await updateDriver.mutateAsync({ id: existing.id, ...form });
        toast.success("✅ ड्राइवर अपडेट हुआ! (Driver updated)");
      } else {
        await addDriver.mutateAsync(form);
        toast.success("✅ ड्राइवर जोड़ा गया! (Driver added)");
      }
      onClose();
    } catch {
      toast.error("कुछ गलत हुआ। (Something went wrong)");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        data-ocid="admin.driver.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "✏️ ड्राइवर संपादित करें" : "➕ नया ड्राइवर जोड़ें"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-sm font-semibold mb-1 block">
              नाम (Name) *
            </Label>
            <Input
              placeholder="ड्राइवर का नाम..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-11 rounded-xl"
              data-ocid="admin.driver.name_input"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1 block">
              गाड़ी नंबर (Car Number) *
            </Label>
            <Input
              placeholder="जैसे: HR01AB1234"
              value={form.carNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, carNumber: e.target.value }))
              }
              className="h-11 rounded-xl uppercase"
              data-ocid="admin.driver.carnumber_input"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1 block">
              फ़ोन (Phone) *
            </Label>
            <Input
              placeholder="10 अंक का नंबर"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="h-11 rounded-xl"
              inputMode="numeric"
              data-ocid="admin.driver.phone_input"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl h-11"
              data-ocid="admin.driver.cancel_button"
            >
              रद्द करें
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground rounded-xl h-11 font-bold"
              disabled={isBusy}
              data-ocid="admin.driver.submit_button"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                "अपडेट करें"
              ) : (
                "जोड़ें"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteConfirmDialog({
  open,
  driver,
  onClose,
}: {
  open: boolean;
  driver: Driver | null;
  onClose: () => void;
}) {
  const deleteDriver = useDeleteDriver();

  async function handleDelete() {
    if (!driver) return;
    try {
      await deleteDriver.mutateAsync(driver.id);
      toast.success("🗑️ ड्राइवर हटाया गया (Driver deleted)");
      onClose();
    } catch {
      toast.error("हटाया नहीं गया। (Delete failed)");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        data-ocid="admin.delete.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">⚠️ क्या हटाएं?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          क्या आप <strong>{driver?.name}</strong> ({driver?.carNumber}) को हटाना
          चाहते हैं? यह वापस नहीं होगा।
        </p>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
            data-ocid="admin.delete.cancel_button"
          >
            नहीं (Cancel)
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDriver.isPending}
            className="flex-1 rounded-xl"
            data-ocid="admin.delete.confirm_button"
          >
            {deleteDriver.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "हाँ, हटाएं"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rides Table ──────────────────────────────────────────────────────────────
function RidesTable({ rides, drivers }: { rides: Ride[]; drivers: Driver[] }) {
  const [filter, setFilter] = useState<RideStatus | "All">("All");

  const filtered =
    filter === "All" ? rides : rides.filter((r) => r.status === filter);

  const statusFilters: Array<RideStatus | "All"> = [
    "All",
    RideStatus.Pending,
    RideStatus.Accepted,
    RideStatus.Completed,
    RideStatus.Cancelled,
  ];

  function getDriverName(driverIdOpt?: bigint) {
    if (!driverIdOpt) return "—";
    const d = drivers.find((dr) => dr.id === driverIdOpt);
    return d ? d.name : `#${driverIdOpt}`;
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {statusFilters.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/40"
            }`}
            data-ocid={`admin.rides.filter.${String(s).toLowerCase()}.tab`}
          >
            {s === "All" ? "सब | All" : s}
            {s !== "All" && (
              <span className="ml-1 opacity-70">
                ({rides.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-border overflow-hidden"
        data-ocid="admin.rides.table"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="text-xs font-bold py-2">ID</TableHead>
                <TableHead className="text-xs font-bold">
                  सवारी (Rider)
                </TableHead>
                <TableHead className="text-xs font-bold">फ़ोन</TableHead>
                <TableHead className="text-xs font-bold">Pickup</TableHead>
                <TableHead className="text-xs font-bold">Drop</TableHead>
                <TableHead className="text-xs font-bold">₹</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold">Driver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.rides.empty_state"
                  >
                    कोई सवारी नहीं (No rides)
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ride, idx) => (
                  <TableRow
                    key={ride.id.toString()}
                    className="text-sm"
                    data-ocid={`admin.rides.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground py-2.5">
                      #{ride.id.toString()}
                    </TableCell>
                    <TableCell className="font-semibold py-2.5">
                      {ride.riderName}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <a
                        href={`tel:${ride.riderPhone}`}
                        className="text-primary hover:underline"
                      >
                        {ride.riderPhone}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate py-2.5 text-xs">
                      {ride.pickupLocation}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {ride.dropLocation}
                    </TableCell>
                    <TableCell className="font-bold py-2.5">
                      ₹{ride.estimatedFare.toString()}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <StatusBadge status={ride.status} />
                    </TableCell>
                    <TableCell className="py-2.5 text-xs">
                      {getDriverName(ride.driverIdOpt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Management List ────────────────────────────────────────────────────
function DriverManagement({ drivers }: { drivers: Driver[] }) {
  const toggleOnline = useToggleDriverOnline();
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      {drivers.map((driver, idx) => (
        <div
          key={driver.id.toString()}
          className="bg-card rounded-2xl border border-border shadow-card p-3 flex items-center gap-3"
          data-ocid={`admin.driver.item.${idx + 1}`}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            🧑‍✈️
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-display font-bold text-sm truncate">
                {driver.name}
              </p>
              {!driver.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {driver.carNumber} · {driver.phone}
            </p>
          </div>

          {/* Online toggle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-gray-300"}`}
            />
            <Switch
              checked={driver.isOnline}
              onCheckedChange={() => toggleOnline.mutate(driver.id)}
              disabled={toggleOnline.isPending}
              data-ocid={`admin.driver.online_toggle.${idx + 1}`}
            />
          </div>

          {/* Edit */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl flex-shrink-0"
            onClick={() => setEditDriver(driver)}
            data-ocid={`admin.driver.edit_button.${idx + 1}`}
          >
            <Pencil size={14} />
          </Button>

          {/* Delete */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
            onClick={() => setDeleteTarget(driver)}
            data-ocid={`admin.driver.delete_button.${idx + 1}`}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}

      {drivers.length === 0 && (
        <div
          className="text-center py-8 text-muted-foreground bg-card rounded-2xl border border-border"
          data-ocid="admin.driver.empty_state"
        >
          <p className="text-3xl mb-2">🚗</p>
          <p>कोई ड्राइवर नहीं (No drivers)</p>
        </div>
      )}

      {/* Add button */}
      <Button
        className="w-full h-12 font-bold bg-primary text-primary-foreground rounded-xl shadow-green hover:bg-primary/90"
        onClick={() => setShowAdd(true)}
        data-ocid="admin.add_driver_button"
      >
        <Plus size={18} className="mr-2" />
        नया ड्राइवर जोड़ें (Add Driver)
      </Button>

      {/* Dialogs */}
      <DriverFormDialog open={showAdd} onClose={() => setShowAdd(false)} />
      <DriverFormDialog
        open={!!editDriver}
        onClose={() => setEditDriver(null)}
        existing={editDriver ?? undefined}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        driver={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Main Admin View ──────────────────────────────────────────────────────────
export default function AdminView() {
  const { data: drivers = [], isLoading: driversLoading } = useGetDrivers();
  const {
    data: rides = [],
    isLoading: ridesLoading,
    refetch: refetchRides,
  } = useGetRides();
  const seedDrivers = useSeedSampleDrivers();

  const totalRides = rides.length;
  const pendingRides = rides.filter(
    (r) => r.status === RideStatus.Pending,
  ).length;
  const activeDrivers = drivers.filter((d) => d.isOnline).length;
  const completedRides = rides.filter(
    (r) => r.status === RideStatus.Completed,
  ).length;

  async function handleReseed() {
    try {
      await seedDrivers.mutateAsync();
      localStorage.removeItem("ambala_taxi_seeded_v1");
      toast.success("✅ सैंपल ड्राइवर जोड़े गए! (Sample drivers seeded)");
    } catch {
      toast.error("Failed to seed drivers");
    }
  }

  return (
    <div className="p-4 space-y-5 animate-slide-in">
      {/* ── Page Title ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold">⚙️ एडमिन डैशबोर्ड</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchRides()}
          className="gap-1.5 rounded-xl h-9"
          data-ocid="admin.refresh_button"
        >
          <RefreshCw size={14} />
          रिफ्रेश
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="🚕" label="कुल सवारी (Total)" value={totalRides} />
        <StatCard
          icon="⏳"
          label="प्रतीक्षा (Pending)"
          value={pendingRides}
          accent={pendingRides > 0}
        />
        <StatCard
          icon="🟢"
          label="ऑनलाइन (Online)"
          value={activeDrivers}
          sub={`of ${drivers.length}`}
        />
        <StatCard icon="✅" label="पूरी (Completed)" value={completedRides} />
      </div>

      {/* ── Inner Tabs: Rides / Drivers ──────────────────────────────────── */}
      <Tabs defaultValue="rides" className="space-y-3">
        <TabsList className="w-full h-auto p-1 rounded-xl bg-secondary gap-1">
          <TabsTrigger
            value="rides"
            className="flex-1 text-sm font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.rides.tab"
          >
            🚕 सवारियाँ (Rides)
          </TabsTrigger>
          <TabsTrigger
            value="drivers"
            className="flex-1 text-sm font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.drivers.tab"
          >
            🧑‍✈️ ड्राइवर ({drivers.length})
          </TabsTrigger>
        </TabsList>

        {/* Rides Tab */}
        <TabsContent value="rides" className="focus-visible:outline-none mt-0">
          {ridesLoading ? (
            <div className="space-y-2" data-ocid="admin.rides.loading_state">
              {["r1", "r2", "r3"].map((k) => (
                <Skeleton key={k} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <RidesTable rides={rides} drivers={drivers} />
          )}
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent
          value="drivers"
          className="focus-visible:outline-none mt-0 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-semibold">
              ड्राइवर प्रबंधन (Driver Management)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReseed}
              disabled={seedDrivers.isPending}
              className="gap-1.5 rounded-xl h-9 text-xs"
              data-ocid="admin.seed_button"
            >
              {seedDrivers.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Seed Drivers
            </Button>
          </div>

          {driversLoading ? (
            <div className="space-y-2" data-ocid="admin.drivers.loading_state">
              {["d1", "d2", "d3", "d4"].map((k) => (
                <Skeleton key={k} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <DriverManagement drivers={drivers} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
