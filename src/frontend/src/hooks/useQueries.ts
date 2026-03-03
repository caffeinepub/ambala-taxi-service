import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Driver, type Ride, RideStatus } from "../backend.d";
import { useActor } from "./useActor";

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useGetDrivers() {
  const { actor, isFetching } = useActor();
  return useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDrivers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOnlineDrivers() {
  const { actor, isFetching } = useActor();
  return useQuery<Driver[]>({
    queryKey: ["drivers", "online"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOnlineDrivers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRides() {
  const { actor, isFetching } = useActor();
  return useQuery<Ride[]>({
    queryKey: ["rides"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRides();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetPendingRides() {
  const { actor, isFetching } = useActor();
  return useQuery<Ride[]>({
    queryKey: ["rides", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRidesByStatus(RideStatus.Pending);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetRidesForDriver(driverId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Ride[]>({
    queryKey: ["rides", "driver", driverId?.toString()],
    queryFn: async () => {
      if (!actor || !driverId) return [];
      return actor.getRidesForDriver(driverId);
    },
    enabled: !!actor && !isFetching && !!driverId,
    refetchInterval: 5000,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useRequestRide() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      riderName: string;
      riderPhone: string;
      pickupLocation: string;
      dropLocation: string;
      estimatedFare: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestRide(
        args.riderName,
        args.riderPhone,
        args.pickupLocation,
        args.dropLocation,
        args.estimatedFare,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
    },
  });
}

export function useAcceptRide() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { rideId: bigint; driverId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptRide(args.rideId, args.driverId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
    },
  });
}

export function useUpdateRideStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { rideId: bigint; status: RideStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateRideStatus(args.rideId, args.status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
    },
  });
}

export function useToggleDriverOnline() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (driverId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.toggleDriverOnline(driverId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useAddDriver() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      carNumber: string;
      phone: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addDriver(args.name, args.carNumber, args.phone);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateDriver() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      name: string;
      carNumber: string;
      phone: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDriver(args.id, args.name, args.carNumber, args.phone);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useDeleteDriver() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteDriver(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useSeedSampleDrivers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.seedSampleDrivers();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}
